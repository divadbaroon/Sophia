export interface ConceptMapEntry {
  understandingLevel: number;
  confidenceInAssessment: number;
  reasoning: string;
  lastUpdated: string;
}

export interface ConceptMap {
  [conceptName: string]: ConceptMapEntry;
}

export interface ConceptMapAgentContext {
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

export interface ConceptMapAgentResponse {
  updatedConceptMap: ConceptMap;
}