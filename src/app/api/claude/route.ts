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
    
    // Create a new ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Query Claude API - with streaming enabled
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
            system: system,
            stream: true
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          controller.error(`Claude API error: ${response.status} ${JSON.stringify(errorData)}`);
          return;
        }

        if (!response.body) {
          controller.error("No response body received");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          // Process the stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              // Skip empty lines and ping events
              if (!line.trim() || line.includes('event: ping')) continue;
              
              // Parse event data
              if (line.startsWith('data:')) {
                try {
                  const data = JSON.parse(line.slice(5).trim());
                  
                  // Handle content block deltas for text
                  if (data.type === 'content_block_delta' && 
                      data.delta && 
                      data.delta.type === 'text_delta') {
                    controller.enqueue(encoder.encode(data.delta.text));
                  }
                } catch (e) {
                  const error = e as Error;
                  console.error('Error parsing event data:', error, line);
                }
              }
            }
          }
        } catch (e) {
          const error = e as Error;
          controller.error(`Error reading stream: ${error.message}`);
        } finally {
          controller.close();
        }
      }
    });

    // Return the stream with the appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json({ 
      message: 'Failed to communicate with Claude API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}