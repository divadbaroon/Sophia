import { NextRequest, NextResponse } from 'next/server';

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

    // Dynamic import concept map agent
    const { ConceptMapAgent } = await import('@/lib/conceptMap/agent/concept-map-agent');
    
    console.log('✅ ConceptMapAgent imported successfully');

    // Call the concept map agent
    const result = await ConceptMapAgent.assessConceptMap(context);

    console.log('🎯 Concept map agent result:', result);

    return NextResponse.json({
      updatedConceptMap: result.updatedConceptMap
    });

  } catch (error) {
    console.error('❌ Error in concept map API:', error);
    
    return NextResponse.json(
      { error: `Failed to update concept map` },
      { status: 500 }
    );
  }
}