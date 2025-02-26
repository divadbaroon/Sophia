import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('ElevenLabs API Route: Request received');
  
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API Route: ElevenLabs API key is not configured');
    return NextResponse.json(
      { error: 'ElevenLabs API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = body;

    if (!text) {
      console.log('ElevenLabs API Route: No text provided');
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log(`ElevenLabs API Route: Processing request for voice ${voiceId} with text length ${text.length}`);

    console.log('ElevenLabs API Route: Calling ElevenLabs API');
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      }),
    });

    console.log('ElevenLabs API Route: ElevenLabs response status:', elevenLabsResponse.status);

    if (!elevenLabsResponse.ok) {
      let errorDetail = '';
      try {
        const errorData = await elevenLabsResponse.json();
        errorDetail = errorData.detail || elevenLabsResponse.statusText;
      } catch (e) {
        console.log(e)
        errorDetail = elevenLabsResponse.statusText;
      }
      
      console.error('ElevenLabs API Route: ElevenLabs API error:', errorDetail);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${errorDetail}` },
        { status: elevenLabsResponse.status }
      );
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    console.log('ElevenLabs API Route: Got audio buffer of size:', audioBuffer.byteLength);
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      }
    });
  } catch (error) {
    console.error('ElevenLabs API Route: Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert text to speech' },
      { status: 500 }
    );
  }
}