import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

interface ConceptMapEntry {
  understandingLevel: number;
  confidenceInAssessment: number;
  reasoning: string;
  lastUpdated: string;
}

interface ConceptMap {
  [conceptName: string]: ConceptMapEntry;
}

interface ConceptMapAgentContext {
  // Task Information
  taskName: string;
  methodName: string;
  methodTemplate: string;
  currentStudentCode: string;
  
  // Test Results
  terminalOutput: string;
  testResults?: {
    totalTests: number;
    passedTests: number;
    failedTests: Array<{
      input: any;
      expected: any;
      actual: any;
      error?: string;
    }>;
  };
  
  // Conversation History
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  
  
  // Current Concept Map
  currentConceptMap: ConceptMap;
  
  // Session Metadata
  sessionId: string;
  profileId: string;
  attemptNumber?: number;
}

interface ConceptMapAgentResponse {
  updatedConceptMap: ConceptMap;
}

export class ConceptMapAgent {
  private static readonly SYSTEM_PROMPT = `
You are a concept map assessment agent for a multimodal learning system teaching Data Structures & Algorithms. Your job is to analyze student interactions and update their understanding levels for specific programming concepts.

## YOUR TASK
Analyze the provided student context and return a COMPLETE updated concept map with revised understanding levels, confidence assessments, and reasoning for each concept.

## ASSESSMENT FRAMEWORK

### Understanding Levels (0.0 - 1.0)
- 0.0-0.2: No understanding - major misconceptions, incorrect approaches
- 0.3-0.4: Minimal understanding - some correct ideas but significant gaps
- 0.5-0.6: Developing understanding - partially correct with common mistakes
- 0.7-0.8: Good understanding - mostly correct with minor issues
- 0.9-1.0: Strong understanding - correct implementation and concepts

### Confidence in Assessment (0.0 - 1.0)
- 0.0-0.3: Low confidence - limited evidence, contradictory signals
- 0.4-0.6: Moderate confidence - some clear evidence but gaps remain
- 0.7-0.8: High confidence - consistent evidence across multiple indicators
- 0.9-1.0: Very high confidence - strong, consistent evidence from multiple sources

## EVIDENCE SOURCES TO ANALYZE

### Code Analysis
- **Correct patterns**: Proper algorithms, efficient approaches, good edge case handling
- **Incorrect patterns**: Wrong algorithms, inefficient approaches, missing edge cases
- **Partial implementations**: TODO comments filled vs unfilled, partial solutions
- **Code quality**: Variable naming, structure, comments showing understanding

### Test Results
- **Passing tests**: Indicates functional understanding
- **Failing tests**: Reveals specific misconceptions (analyze error types)
- **Edge case handling**: Empty inputs, null values, boundary conditions
- **Performance implications**: Efficiency of chosen approach

### Conversation History
- **Explanations**: How they verbally describe their approach
- **Questions asked**: What they're confused about or seeking clarification on
- **Misconceptions expressed**: Incorrect statements about how algorithms work
- **Insights shared**: Moments of understanding or "aha" moments
- **CRITICAL: Dependency on explanations** - If student needed fundamental concepts explained before coding correctly, this indicates lower understanding regardless of final code quality
- **Independence level** - Students who solve problems after hints vs. those who need core concepts explained

## UPDATE RULES

### Decrease Understanding When:
- Tests fail due to algorithmic errors (not syntax)
- Code shows fundamental misconceptions
- Student expresses incorrect understanding verbally
- Repeated same mistakes across attempts
- Missing or incorrect edge case handling
- Inefficient approaches when better ones are obvious
- **Student requires explanation of core concepts before implementing correctly - needing the answer explained indicates lack of independent understanding**
- **Student implements correctly ONLY after being given direct guidance or hints about the approach**

### Increase Understanding When:
- Tests pass after being broken
- Code shows correct algorithmic thinking
- Student explains concepts accurately in conversation
- Student fixes their own mistakes through reasoning
- Student handles edge cases correctly
- Code demonstrates efficiency awareness
- **Student arrives at correct solution independently without needing concept explanations**
- **Student can explain their reasoning BEFORE implementing, not just after**

### Increase Confidence When:
- Multiple evidence sources align (code + voice + tests)
- Consistent performance across similar problems
- Student can explain their reasoning clearly
- Evidence is recent and substantial
- Student demonstrates deep understanding through explanation

### Decrease Confidence When:
- Contradictory evidence from different sources
- Limited recent evidence
- Student seems uncertain or guessing
- Evidence is ambiguous or inconclusive
- Student's explanations don't match their code

## REASONING GUIDELINES
Write specific, evidence-based reasoning that references:
- Specific code patterns or errors observed
- Particular test results and what they reveal
- Key phrases or explanations from conversation
- Changes since last assessment
- **IMPORTANT: If student required explanation of basic concepts (e.g., "BST properties mean left < root < right") before implementing correctly, this should significantly lower understanding level - correct implementation after explanation ≠ true understanding**

## OUTPUT FORMAT
Return ONLY a valid JSON object with this structure:

\`\`\`json
{
  "updatedConceptMap": {
    "Concept Name 1": {
      "understandingLevel": 0.75,
      "confidenceInAssessment": 0.80,
      "reasoning": "Student correctly implemented the algorithm and explained the logic clearly, but made a minor edge case error that was quickly fixed.",
      "lastUpdated": "2025-01-20T15:30:45Z"
    },
    "Concept Name 2": {
      "understandingLevel": 0.45,
      "confidenceInAssessment": 0.70,
      "reasoning": "Code shows partial understanding but fundamental misconception about null handling. Failed 2/3 tests due to missing base cases.",
      "lastUpdated": "2025-01-20T15:30:45Z"
    }
  }
\`\`\`

## IMPORTANT NOTES
- Focus on evidence from the current session, but consider patterns over time
- If evidence is insufficient, maintain current levels but may adjust confidence
- Provide actionable insights in overall assessment
`;

  static async assessConceptMap(
    context: ConceptMapAgentContext
  ): Promise<ConceptMapAgentResponse> {
    try {
        console.log("AGENT CONTEXT", context)
      const userPrompt = this.buildUserPrompt(context);
      
      const result = await generateText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        system: this.SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.3, // Lower temperature for more consistent assessments
        maxTokens: 4000,
      });

      // Parse the JSON response
      let response;
        try {
        // Remove markdown code blocks if present
        let jsonText = result.text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        response = JSON.parse(jsonText);
        } catch (parseError) {
        console.error('Failed to parse AI response:', result.text);
        throw parseError;
        }
            
      return {
        updatedConceptMap: response.updatedConceptMap,
      };

    } catch (error) {
      console.error('Error in concept map assessment:', error);
      
      // Return the original concept map with error note if parsing fails
      return {
        updatedConceptMap: context.currentConceptMap,
      };
    }
  }

  private static buildUserPrompt(context: ConceptMapAgentContext): string {
    const currentTime = new Date().toISOString();
    
    let prompt = `ASSESS CONCEPT MAP FOR: ${context.taskName} (${context.methodName})

CURRENT CONTEXT:
=============

**Task Information:**
- Method: ${context.methodName}
- Task: ${context.taskName}

**Method Template (Starting Code):**
\`\`\`
${context.methodTemplate}
\`\`\`

**Current Student Code:**
\`\`\`
${context.currentStudentCode}
\`\`\`

**Terminal Output/Test Results:**
\`\`\`
${context.terminalOutput}
\`\`\`
`;

    // Add detailed test results if available
    if (context.testResults) {
      prompt += `
**Detailed Test Analysis:**
- Total Tests: ${context.testResults.totalTests}
- Passed: ${context.testResults.passedTests}
- Failed: ${context.testResults.totalTests - context.testResults.passedTests}

Failed Test Details:
${context.testResults.failedTests.map((test, i) => 
  `Test ${i + 1}: Expected ${JSON.stringify(test.expected)}, Got ${JSON.stringify(test.actual)}${test.error ? `, Error: ${test.error}` : ''}`
).join('\n')}
`;
    }

    // Add conversation history
    if (context.conversationHistory.length > 0) {
      prompt += `
**Recent Conversation (last 10 messages):**
${context.conversationHistory.slice(-10).map(msg => 
  `[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`
).join('\n')}
`;
    }

    // Add current concept map
    prompt += `
**Current Concept Map to Update:**
\`\`\`json
${JSON.stringify(context.currentConceptMap, null, 2)}
\`\`\`

**Assessment Time:** ${currentTime}

ANALYZE the evidence above and return the updated concept map following the specified format. Focus on what the code, test results, and conversations reveal about the student's understanding of each concept.`;

    return prompt;
  }

  // Utility method to create context from your existing data structures
  static createContext(
    taskName: string,
    methodName: string,
    methodTemplate: string,
    currentCode: string,
    terminalOutput: string,
    conversationHistory: any[],
    currentConceptMap: ConceptMap,
    sessionId: string,
    profileId: string,
    options: {
      testResults?: any;
    } = {}
  ): ConceptMapAgentContext {
    return {
      taskName,
      methodName,
      methodTemplate,
      currentStudentCode: currentCode,
      terminalOutput,
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString()
      })),
      currentConceptMap,
      sessionId,
      profileId,
      testResults: options.testResults,
    };
  }
}