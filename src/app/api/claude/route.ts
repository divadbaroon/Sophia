import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { addLineNumbers } from '@/utils/claude/codeModifier'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/**
 * Creates a context message with all relevant file and scenario details
 */
function createContextMessage(
  studentTask: string, 
  studentCode: string, 
  errorMessage: string,
  executionOutput: string,
  highlightedText: string,
  lineNumber: number | string | null,
): string {
  const contextParts = [];

  if (studentTask) {
    contextParts.push(`Task: ${studentTask}`);
  }
  
  if (studentCode) {
    const numberedCode = addLineNumbers(studentCode);
    contextParts.push(`=== STUDENT CODE ===\n\`\`\`python\n${numberedCode}\n\`\`\``);
  }
  
  if (errorMessage) {
    contextParts.push(`=== ERROR MESSAGE ===\n\`\`\`\n${errorMessage}\n\`\`\``);
  }
  
  if (executionOutput) {
    contextParts.push(`=== EXECUTION OUTPUT ===\n\`\`\`\n${executionOutput}\n\`\`\``);
  }

  if (highlightedText) {
    contextParts.push(`=== HIGHLIGHTED TEXT ===\nStudent's highlighted text: "${highlightedText}"`);
  }

  if (lineNumber !== null && lineNumber !== '') {
    contextParts.push(`Line number: ${lineNumber}`);
  }
  
  return contextParts.join('\n\n');
}

/**
 * Prepares system message for communicating with Claude
 */
function prepareClaudePrompt(contextContent: string): string {
  const systemContent = `You're having a tutoring conversation with a CS student who got stuck on their programming assignment. Be the kind of supportive, knowledgeable tutor you'd want to have - someone who's patient, encouraging, and really good at explaining things clearly.

CONVERSATION APPROACH:
Always start with this exact greeting:

"Hello! I'm here to help you work through whatever's confusing you. What's your biggest confusion right now?"

Then listen carefully to their response. That will tell you exactly where to focus your help. Keep the conversation natural and supportive - you're here to help them learn, not to lecture them.

Adjust your explanations based on how they respond. If they seem to follow along easily, you can move faster. If they look confused, slow down and try a different approach. The goal is to meet them where they are and help them move forward.

IMPORTANT GUIDELINES YOU MUST FOLLOW IN YOUR RESPONSE:
  - Keep responses short and conversational (2-3 sentences max)
  - If the user is correct, let them know it looks good and ask if there is anything else they need help with.
  - Don't explain back to them what they just wrote correctly
  - Avoid giving direct answers - provide guidance and let them work it out
  - If they ask for syntax, give the general syntax pattern rather than their specific solution
  - End responses with encouragement like "Give it a shot" or "Want to try that?"
  - Focus on being a supportive friend, not a code reviewer
  - Try not to repeat what has already been mentioned in the conversation unless it is necessary

SPECIAL INTERACTION FEATURES:
1. Text Highlighting by Student:
  - You can instruct the student to highlight portions of their code in the editor which will include it as context to you
  - When they do, you'll see "Student's highlighted text: [text they highlighted]" in your context
  - Respond directly to any highlighted code sections when you see them

2. Code Line References:
  - CRITICAL: When discussing code, reference line numbers using the exact format "in line X" (e.g., "in line 5")
  - Reference only ONE line number at a time in each sentence
  - If you need to refer to multiple lines, use separate sentences for each line reference
  - NEVER quote the actual code content from those lines
  - The system will automatically highlight any line numbers you mention in this format

SESSION MANAGEMENT:
Pay attention to when the student has worked through their main confusion. Once they seem to understand the concept and feel confident, offer to wrap up naturally with something like:

"It sounds like you've got a good handle on this now! Ready to continue on your own?"

Don't mention ending the session unless it feels like a natural stopping point. Let the conversation flow organically.

Remember: Be conversational, empathetic, and genuinely helpful - like the best study partner they could have.`;

  if (contextContent) {
    return `${systemContent}\n\nCURRENT CONTEXT:\n${contextContent}`;
  }
  
  return systemContent;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, context, currentMessage } = await request.json()

    // Create the context message content
    const contextContent = createContextMessage(
      context.task || '',
      context.code || '',
      context.errors || '',
      context.executionOutput || '',
      context.highlightedText || '',
      context.lineNumber || null
    )

    // Get the complete system prompt with context
    const systemPrompt = prepareClaudePrompt(contextContent)

    // Build conversation messages (only user/assistant roles)
    const conversationMessages = [
      ...messages,
      { role: 'user' as const, content: currentMessage }
    ]

    // Create a streaming response
    const stream = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: conversationMessages,
      stream: true,
    })

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder()
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Claude API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}