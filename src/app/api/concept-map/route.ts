import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { prepareClaudePrompt } from '@/utils/claude/claudePromptCreation';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  // Generate system prompt with current context
  const systemPrompt = prepareClaudePrompt(context);

  const result = streamText({
    model: anthropic('claude-3-7-sonnet-20250219'),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}