// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ElevenLabsClient } from 'npm:elevenlabs';
import * as hash from 'npm:object-hash';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const elevenlabs = new ElevenLabsClient({
  apiKey: Deno.env.get('ELEVENLABS_API_KEY'),
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Upload audio to Supabase Storage in a background task
async function uploadAudioToStorage(stream: ReadableStream, requestHash: string) {
  const { data, error } = await supabase.storage
    .from('sophia-tts-audio') // Use your bucket name
    .upload(`${requestHash}.mp3`, stream, {
      contentType: 'audio/mp3',
    });

  console.log('Storage upload result', { data, error });
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request based on method
    let text, voiceId;
    
    if (req.method === 'POST') {
      const body = await req.json();
      text = body.text;
      voiceId = body.voiceId || 'JBFqnCBsd6RMkjVDRZzb';
    } else {
      const url = new URL(req.url);
      const params = new URLSearchParams(url.search);
      text = params.get('text');
      voiceId = params.get('voiceId') || 'JBFqnCBsd6RMkjVDRZzb';
    }

    const requestHash = hash.MD5({ text, voiceId });
    console.log('Request hash', requestHash);

    // Check storage for existing audio file
    const { data } = await supabase.storage
      .from('sophia-tts-audio') // Use your bucket name
      .createSignedUrl(`${requestHash}.mp3`, 60);

    if (data) {
      console.log('Audio file found in storage', data);
      const storageRes = await fetch(data.signedUrl);
      if (storageRes.ok) {
        return new Response(storageRes.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
          },
        });
      }
    }

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text parameter is required' }), {
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      });
    }

    console.log('ElevenLabs API call');
    const response = await elevenlabs.textToSpeech.stream(voiceId, {
      output_format: 'mp3_44100_128',
      model_id: 'eleven_multilingual_v2',
      text,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    // Branch stream to Supabase Storage
    const [browserStream, storageStream] = stream.tee();

    // Upload to Supabase Storage in the background
    EdgeRuntime.waitUntil(uploadAudioToStorage(storageStream, requestHash));

    // Return the streaming response immediately
    return new Response(browserStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.log('error', { error });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      },
    });
  }
});