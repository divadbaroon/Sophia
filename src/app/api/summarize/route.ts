import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { TestCase } from '@/types' 

export const runtime = 'edge'

interface FileContext {
  fileName?: string;
  content?: string;
  testCases?: TestCase[];
  executionOutput?: string;
  errorMessage?: string;
  highlightedText?: string;
}

interface MessageWithHighlight {
  role: 'user' | 'assistant';
  content: string;
  highlightedCode?: string;
}

interface RequestBody {
  transcript: string;
  fileContext: FileContext;
  conversationHistory: MessageWithHighlight[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Extract just the twoSum function from the full code
const extractTwoSumFunction = (content: string): string => {
  // Look for the twoSum function definition
  const functionMatch = content.match(/def twoSum\(self,[\s\S]*?\)[\s\S]*?(?:pass|return)/);
  if (functionMatch) {
    return functionMatch[0];
  }
  return content; // Return original if not found
}

const createSystemPrompt = (fileContext: FileContext, conversationHistory: MessageWithHighlight[]): string => {
  // Build conversation history string
  const conversationString = conversationHistory.map(msg => {
    let messageText = `${msg.role === 'user' ? 'Student' : 'TA'}: ${msg.content}`;
    
    if (msg.highlightedCode) {
      messageText += `\n[With highlighted code]: \n\`\`\`\n${msg.highlightedCode}\n\`\`\``;
    }
    
    return messageText;
  }).join('\n\n');

  let prompt = `You are a teaching assistant summarizing a tutoring session with a student. You've gone through a structured tutoring process with this student, focusing first on understanding their problem, then on building conceptual knowledge, and finally on implementation guidance.

Now, create a helpful summary of what you've discussed and learned so far. After the summary, ask if they'd like to continue working with you or if they feel ready to meet with their human teaching assistant.

Your response should have two clear parts:
1. A concise summary (3-5 bullet points) of what you've covered, including:
   - The student's main challenge
   - Key concepts discussed
   - Progress made so far
   - Remaining challenges or questions

2. A check-in asking if they'd like to:
   - Continue working with you for more guided practice
   - Meet with their human TA now that they have a clearer understanding

Keep your tone supportive and encouraging, highlighting their progress.`;

  // Add the complete conversation history
  prompt += `\n\nHere's the complete conversation history:\n\n${conversationString}`;

  // Add the simplified code content if available
  if (fileContext.content) {
    const simplifiedContent = extractTwoSumFunction(fileContext.content);
    prompt += `\n\nThe student is working on this code:\n\`\`\`python\n${simplifiedContent}\n\`\`\``
  }

  // Add execution output if available
  if (fileContext.executionOutput) {
    prompt += `\n\nThe code produced this output when executed:\n\`\`\`\n${fileContext.executionOutput}\n\`\`\``
  }

  // Add error message if available
  if (fileContext.errorMessage) {
    prompt += `\n\nThe student encountered this error:\n\`\`\`\n${fileContext.errorMessage}\n\`\`\``
  }

  // Add highlighted text if available
  if (fileContext.highlightedText) {
    prompt += `\n\nThe student recently highlighted this code:\n\`\`\`\n${fileContext.highlightedText}\n\`\`\``
  }

  prompt += `\n\nBased on this conversation, provide:
1. A concise but thorough summary of what's been discussed and learned
2. A check-in about whether they're ready to meet with their human TA

Remember:
- Focus on their conceptual understanding and progress
- Highlight any key insights or breakthroughs
- Don't introduce new concepts or guidance in this summary
- Make the summary encouraging and confidence-building
- Make it clear they can continue working with you or transition to their human TA`

  console.log('Final summary prompt:', prompt)
  return prompt
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, fileContext, conversationHistory }: RequestBody = await req.json()
    console.log('Received summary request:', { 
      transcript, 
      conversationHistoryLength: conversationHistory.length,
      fileContext: {
        ...fileContext,
        content: extractTwoSumFunction(fileContext.content || '')
      } 
    })

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    streamOpenAIResponse(transcript, fileContext, conversationHistory, writer).catch(error => {
      console.error('Error in OpenAI stream:', error)
      writer.write(encoder.encode('Error: Failed to process your request.'))
      writer.close()
    })

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function streamOpenAIResponse(
  transcript: string, 
  fileContext: FileContext,
  conversationHistory: MessageWithHighlight[],
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  const encoder = new TextEncoder()
  
  try {
    // Create a modified fileContext with just the twoSum function
    const simplifiedFileContext = {
      ...fileContext,
      content: fileContext.content ? extractTwoSumFunction(fileContext.content) : undefined
    };

    const systemPrompt = createSystemPrompt(simplifiedFileContext, conversationHistory)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: transcript || "Can you summarize what we've discussed so far?"
        }
      ],
      stream: true,
      temperature: 0.3, 
      max_tokens: 800  // Increased token limit for summaries
    })

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`))
      }
    }
    
    await writer.write(encoder.encode(`data: [DONE]\n\n`))
  } catch (error) {
    console.error('Error streaming from OpenAI:', error)
    await writer.write(
      encoder.encode(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`)
    )
  } finally {
    await writer.close()
  }
}