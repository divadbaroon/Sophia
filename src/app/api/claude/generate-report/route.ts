import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { Session } from '@/types';

const REPORT_SYSTEM_PROMPT = `You are an expert AI education analyst. Your task is to analyze evaluation criteria results from teaching agent simulations and generate a report with full section-based prompt modifications.

You will receive:
1. Session metadata (name, subject, difficulty)
2. The current agent prompt
3. Evaluation criteria results with rationales for each session

Generate a report with these three sections:

**Overview**: A 2-3 sentence high-level analysis of the teaching agent's performance patterns, focusing on areas that need improvement based on failed criteria.

**Specific Issues**: Extract ONLY instances where evaluation criteria FAILED (result !== "success"). For each failed criterion, provide:
- Session name and context
- The specific issue described in the failure rationale
- Which evaluation criterion failed (use the criterion NAME, not ID)

If NO criteria failed across all sessions, return an empty array.

**Prompt Suggestions**: Instead of small snippets, provide FULL SECTION updates that show exactly how to modify complete sections of the agent prompt. Each suggestion should show:
- The complete current section (if it exists)
- The complete updated section with modifications
- Clear indication of what's being added or removed

Format each suggestion as:
{
  "sectionTitle": "Name of the section being modified (e.g., 'Goal', 'Teaching Style', 'Response Guidelines')",
  "currentSection": "The full current text of this section from the prompt, or null if section doesn't exist",
  "updatedSection": "The complete updated section with all modifications",
  "changeType": "add" | "modify" | "replace",
  "addedText": ["Array of text snippets being added"],
  "removedText": ["Array of text snippets being removed"],
  "reason": "Brief explanation of why this section change addresses the failed criteria"
}

For section identification, look for common prompt sections like:
- Goal/Objective
- Teaching Style/Approach  
- Response Guidelines
- Student Interaction Rules
- Assessment Methods
- Error Handling
- Personalization Instructions

If creating a new section, set currentSection to null.

If NO criteria failed, return an empty array with no suggestions.

Return your response as a JSON object with this structure:
{
  "overview": "string",
  "specificIssues": [
    {
      "sessionName": "string",
      "issue": "string", 
      "criteriaFailed": "string (use criterion NAME)"
    }
  ],
  "promptSuggestions": [
    {
      "sectionTitle": "string",
      "currentSection": "string | null",
      "updatedSection": "string",
      "changeType": "add" | "modify" | "replace",
      "addedText": ["string"],
      "removedText": ["string"],
      "reason": "string"
    }
  ]
}

Focus ONLY on failed evaluation criteria and provide complete section updates that address the specific issues found.`;

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Generate report API called!');
    
    const body = await req.json();
    const { sessions, currentPrompt } = body;

    if (!sessions || !Array.isArray(sessions)) {
      return NextResponse.json(
        { error: 'Sessions array is required' },
        { status: 400 }
      );
    }

    if (!currentPrompt) {
      return NextResponse.json(
        { error: 'Current prompt is required to generate section-based suggestions' },
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

    console.log(`📊 Analyzing ${completedSessions.length} completed sessions with current prompt`);

    // Build the user prompt with session data and current prompt
    const userPrompt = buildUserPrompt(completedSessions, currentPrompt);
    
    // Call Claude API
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: REPORT_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3,
      maxTokens: 4000,
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

function buildUserPrompt(sessions: Session[], currentPrompt: string): string {
  let prompt = `## Current Agent Prompt:\n\`\`\`\n${currentPrompt}\n\`\`\`\n\n`;
  
  prompt += `Analyze the following ${sessions.length} teaching agent simulation sessions:\n\n`;

  // Count total failed criteria for context
  let totalFailures = 0;

  sessions.forEach((session, index) => {
    prompt += `## Session ${index + 1}: ${session.studentName}\n`;
    prompt += `- Subject: ${session.subject}\n`;
    prompt += `- Difficulty: ${session.difficulty}\n`;
    prompt += `- Description: ${session.description}\n\n`;

    // Add ONLY evaluation results (no conversation transcript)
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
    prompt += `\nNOTE: All evaluation criteria passed across all sessions. For both "specificIssues" and "promptSuggestions" sections, return empty arrays since there were no failures and therefore no prompt changes are needed.`;
  } else {
    prompt += `\nFocus your analysis on the ${totalFailures} failed criteria across these sessions. Extract specific issues ONLY from failed criteria rationales. For prompt suggestions, identify complete sections of the current prompt that need modification and provide the full updated sections that would address these specific failures.`;
  }

  return prompt;
}