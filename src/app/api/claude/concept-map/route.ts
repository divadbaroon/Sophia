import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { CONCEPT_MAP_SYSTEM_PROMPT } from '@/lib/conceptMap/prompt/conceptMapPrompts';
import { ConceptMapContextBuilder } from '@/lib/conceptMap/utils/contextBuilder';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Concept map API called!');
    
    const body = await req.json();
    const { context } = body;

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    console.log('📨 Received context for method:', context.methodName);

    // Build the user prompt
    const userPrompt = ConceptMapContextBuilder.buildUserPrompt(context);
    
    // Call AI SDK directly
    const result = await generateText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      system: CONCEPT_MAP_SYSTEM_PROMPT,
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

    console.log('🎯 Concept map assessment completed');

    return NextResponse.json({
      updatedConceptMap: response.updatedConceptMap
    });

  } catch (error) {
    console.error('❌ Error in concept map API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to update concept map', details: errorMessage },
      { status: 500 }
    );
  }
}