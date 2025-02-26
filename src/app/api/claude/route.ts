import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
  if (!CLAUDE_API_KEY) {
    return NextResponse.json(
      { message: 'Claude API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { messages, system } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { message: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    console.log("Message to claude", messages);
    console.log("System message to claude", system);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        messages: messages,
        system: system 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      role: 'assistant',
      content: data.content[0].text
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json({ 
      message: 'Failed to communicate with Claude API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}