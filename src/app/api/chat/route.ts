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
  let prompt = `You are a teaching assistant helping a student with their programming assignment. Embody a helpful, supportive TA persona who guides students to find solutions rather than giving answers directly.

Your approach should be:
1. Listen carefully to the student's problem
2. Ask concise, specific questions about their code
3. Guide them toward understanding the issue themselves
4. Provide targeted hints rather than complete solutions
5. Be encouraging and patient

Some examples of concise questions you should ask:
- "What do you think is causing the problem you're experiencing?"
- "What troubleshooting steps have you taken so far?"
- "Have you checked for similar errors in the documentation?"
- "What is your understanding of how this function should work?"
- "Can you walk me through your logic in this section?"

Keep your questions and explanations brief and directly related to their specific issue.`

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

  prompt += `\n\nThis function should find two numbers in the array that add up to the target value and return their indices.

Remember to:
- Address their specific problem rather than giving general advice
- Ask targeted questions that help them think through the issue
- Be concise and direct in your responses
- Guide them to discover the solution themselves
- Balance supportiveness with allowing them to learn through struggle
- Avoid writing their code for them
- Focus on teaching them to debug and problem-solve independently

Start by understanding their immediate issue, and then help them through the debugging process with targeted questions.`

  console.log('Final system prompt:', prompt)
  return prompt
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, fileContext }: RequestBody = await req.json()
    console.log('Received request with context:', { 
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