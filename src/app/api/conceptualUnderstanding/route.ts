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

// Extract just the twoSum function from the full code
const extractTwoSumFunction = (content: string): string => {
  // Look for the twoSum function definition
  const functionMatch = content.match(/def twoSum\(self,[\s\S]*?\)[\s\S]*?(?:pass|return)/);
  if (functionMatch) {
    return functionMatch[0];
  }
  return content; // Return original if not found
}

const createSystemPrompt = (fileContext: FileContext): string => {
  let prompt = `You are a teaching assistant helping a student with their programming assignment. For this conceptual understanding stage, focus on assessing and building the student's conceptual knowledge related to the problem.

You've already helped them understand the problem statement. Now, ask questions to ensure they understand the core concepts needed for implementation.

Your questions should focus on:
1. Algorithmic thinking and data structures
2. Time/space complexity considerations 
3. Key concepts needed for the problem (e.g., hash maps, two-pointer techniques)

Focus your interactions on questions like:
- "What approaches do you know for finding pairs in an array?"
- "What's the time complexity of your current approach?"
- "What data structures could help make this more efficient?"
- "What's a brute force way to solve this, and how could we improve it?"

Your goal is to build their conceptual understanding, not solve the problem for them.`

  // Add the simplified code content if available
  if (fileContext.content) {
    const simplifiedContent = extractTwoSumFunction(fileContext.content);
    prompt += `\n\nThe student is currently looking at this code:\n\`\`\`python\n${simplifiedContent}\n\`\`\``
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
    prompt += `\n\nThe student has highlighted this specific part of the code:\n\`\`\`\n${fileContext.highlightedText}\n\`\`\``
  }

  // Add context about test cases
  if (fileContext.testCases && fileContext.testCases.length > 0) {
    const testCaseDescription = fileContext.testCases.map((tc, index) => {
      return `Test ${index + 1}: nums=${JSON.stringify(tc.input.nums)}, target=${tc.input.target}, expected output=${JSON.stringify(tc.expected)}`;
    }).join('\n');
    
    prompt += `\n\nThe function needs to pass these test cases:\n\`\`\`\n${testCaseDescription}\n\`\`\``;
  }

  prompt += `\n\nThis is the CONCEPTUAL UNDERSTANDING stage of helping the student. For the Two Sum problem, key concepts include:

1. Hash maps for O(n) lookup
2. Trade-offs between time and space complexity
3. Array traversal techniques
4. The concept of complementary values

Your goal is to make sure they understand these concepts before moving to implementation details. Ask conceptual questions first, then guide them toward a solution approach.

Remember:
- Don't give direct solutions
- Ask questions about algorithms and data structures
- Help them understand the efficiency of different approaches
- Build their problem-solving skills through guided discovery`

  console.log('Final conceptual understanding prompt:', prompt)
  return prompt
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, fileContext }: RequestBody = await req.json()
    console.log('Received conceptual understanding request:', { 
      transcript, 
      fileContext: {
        ...fileContext,
        content: extractTwoSumFunction(fileContext.content || '')
      } 
    })

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
    // Create a modified fileContext with just the twoSum function
    const simplifiedFileContext = {
      ...fileContext,
      content: fileContext.content ? extractTwoSumFunction(fileContext.content) : undefined
    };

    const systemPrompt = createSystemPrompt(simplifiedFileContext)

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