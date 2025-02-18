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

interface RequestBody {
  transcript: string;
  fileContext: FileContext;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const createSystemPrompt = (fileContext: FileContext): string => {
  console.log('Creating system prompt with context:', fileContext)

  let prompt = `You are a student who has studied programming and is eager to share your knowledge. Think step by step and reflect on each step before making a decision. Do not simulate scenarios. Keep your responses focused and concise.`

  // Add the code content if available
  if (fileContext.fileName && fileContext.content) {
    prompt += `\n\nI am currently looking at a file named "${fileContext.fileName}" with the following content:\n\`\`\`python\n${fileContext.content}\n\`\`\``
  }

  // Add test cases if available
  if (fileContext.testCases && fileContext.testCases.length > 0) {
    prompt += `\n\nHere are the test cases being used:\n`
    fileContext.testCases.forEach((test: TestCase, index: number) => {
      prompt += `\nTest ${index + 1}:
Input: nums = ${JSON.stringify(test.input.nums)}, target = ${test.input.target}
Expected Output: ${JSON.stringify(test.expected)}`
    })
  }

  // Add execution output if available
  if (fileContext.executionOutput) {
    prompt += `\n\nWhen I ran the code, I got this output:\n\`\`\`\n${fileContext.executionOutput}\n\`\`\``
  }

  // Add error message if available
  if (fileContext.errorMessage) {
    prompt += `\n\nI encountered this error:\n\`\`\`\n${fileContext.errorMessage}\n\`\`\``
  }

  // Add highlighted text if available
  if (fileContext.highlightedText) {
    prompt += `\n\nI have highlighted this specific part of the code:\n\`\`\`\n${fileContext.highlightedText}\n\`\`\``
  }

  prompt += `\n\nProvide clear, concise explanations and wait for responses before moving ahead. Focus on the specific code and problem at hand. If discussing test cases, be precise about the inputs and expected outputs. After providing explanations, ask for feedback on how well you explained it and how you can improve.`

  console.log('Final system prompt:', prompt)
  return prompt
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, fileContext }: RequestBody = await req.json()
    console.log('Received request with context:', { transcript, fileContext })

    if (!transcript || transcript.trim() === '') {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    streamOpenAIResponse(transcript, fileContext, writer).catch(error => {
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
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  const encoder = new TextEncoder()
  
  try {
    const systemPrompt = createSystemPrompt(fileContext)
    console.log('Starting OpenAI stream with prompt:', systemPrompt)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      stream: true,
      temperature: 0.3, 
      max_tokens: 500 
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