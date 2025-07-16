import { ConceptMap, ConceptMapAgentContext } from "../types/types";

export class ConceptMapContextBuilder {
  static buildUserPrompt(context: ConceptMapAgentContext): string {
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