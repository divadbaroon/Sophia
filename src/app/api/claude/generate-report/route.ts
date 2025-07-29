import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { Session } from '@/types';

const REPORT_SYSTEM_PROMPT = `You are an expert AI education analyst. Your task is to analyze evaluation criteria results from teaching agent simulations and generate a report focusing ONLY on failed criteria.

You will receive:
1. Session metadata (name, subject, difficulty)
2. Evaluation criteria results with rationales for each session
3. Performance metrics

Generate a report with these three sections:

**Overview**: A 2-3 sentence high-level analysis of the teaching agent's performance patterns, focusing on areas that need improvement based on failed criteria.

**Specific Issues**: Extract ONLY instances where evaluation criteria FAILED (result !== "success"). For each failed criterion, provide:
- Session name and context
- The specific issue described in the failure rationale
- Which evaluation criterion failed

If NO criteria failed across all sessions, return an empty array.

**Recommendations**: Provide 3-5 actionable recommendations for improving the teaching agent based on the failed criteria patterns.

Return your response as a JSON object with this structure:
{
  "overview": "string",
  "specificIssues": [
    {
      "sessionName": "string",
      "issue": "string", 
      "criteriaFailed": "string"
    }
  ],
  "recommendations": [
    "string"
  ]
}

Focus ONLY on failed evaluation criteria and their rationales. Ignore successful criteria.`;

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Generate report API called!');
    
    const body = await req.json();
    const { sessions } = body;

    if (!sessions || !Array.isArray(sessions)) {
      return NextResponse.json(
        { error: 'Sessions array is required' },
        { status: 400 }
      );
    }

    // Filter completed sessions
    const completedSessions = sessions.filter((session: Session) => 
      session.status === "completed" && session.simulationResult
    );

    if (completedSessions.length === 0) {
      return NextResponse.json(
        { error: 'No completed sessions found' },
        { status: 400 }
      );
    }

    console.log(`📊 Analyzing ${completedSessions.length} completed sessions`);

    // Build the user prompt with session data
    const userPrompt = buildUserPrompt(completedSessions);
    
    // Call Claude API
    const result = await generateText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      system: REPORT_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3,
      maxTokens: 3000,
    });

    // Parse response
    let jsonText = result.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    
    const response = JSON.parse(jsonText);

    console.log('✅ Report generation completed');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in generate report API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to generate report', details: errorMessage },
      { status: 500 }
    );
  }
}

function buildUserPrompt(sessions: Session[]): string {
  let prompt = `Analyze the following ${sessions.length} teaching agent simulation sessions:\n\n`;

  // Count total failed criteria for context
  let totalFailures = 0;

  sessions.forEach((session, index) => {
    prompt += `## Session ${index + 1}: ${session.studentName}\n`;
    prompt += `- Subject: ${session.subject}\n`;
    prompt += `- Difficulty: ${session.difficulty}\n`;
    prompt += `- Description: ${session.description}\n\n`;

    // Add evaluation results
    if (session.simulationResult?.analysis?.evaluationCriteriaResults) {
      prompt += `### Evaluation Results:\n`;
      Object.entries(session.simulationResult.analysis.evaluationCriteriaResults).forEach(([criterionId, result]) => {
        prompt += `**${result.name || criterionId}**: ${result.result}\n`;
        if (result.rationale) {
          prompt += `${result.rationale}\n`;
        }
        
        // Count failures
        if (result.result !== "success") {
          totalFailures++;
        }
        
        prompt += `\n`;
      });
    }

    // Add overall call status if relevant
    if (session.simulationResult?.analysis?.callSuccessful) {
      prompt += `### Overall Session Status: ${session.simulationResult.analysis.callSuccessful}\n`;
    }

    prompt += `\n---\n\n`;
  });

  if (totalFailures === 0) {
    prompt += `\nNOTE: All evaluation criteria passed across all sessions. For the "specificIssues" section, return an empty array since there were no failures.`;
  } else {
    prompt += `\nFocus your analysis on the ${totalFailures} failed criteria across these sessions. Extract specific issues ONLY from failed criteria rationales.`;
  }

  return prompt;
}