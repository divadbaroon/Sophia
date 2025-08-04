
// Session
interface SessionContextType {
  // Core session data
  sessionId: string;
  lessonId: string;
  sessionData: TaskData | null;
  isLoadingTasks: boolean;
  
  // Navigation (from hook)
  currentMethodIndex: number;
  activeMethodId: string;
  currentTestCases: any[];
  setCurrentMethodIndex: (index: number) => void;
  goToNextMethod: () => void;
  goToPrevMethod: () => void;
}

// Code Editor
export interface CodeEditorContextType {
  // File content state
  fileContent: string;
  cachedFileContent: string;
  setFileContent: React.Dispatch<React.SetStateAction<string>>;
  updateCachedFileContent: (content: string) => void;
  isSaved: () => boolean;

  // Error and execution state
  errorContent: string;
  setErrorContent: React.Dispatch<React.SetStateAction<string>>;
  executionOutput: string;
  updateExecutionOutput: (output: string) => Promise<void>;

  // Text selection and highlighting
  highlightedText: string;
  updateHighlightedText: (text: string) => void;
  lineNumber: number | null;
  updateLineNumber: (line: number | null) => void;

  // Code management per method
  codeLoading: boolean;
  methodsCode: Record<string, string>;
  updateMethodsCode: (methodId: string, code: string) => void;
}

// Task Progress
export interface TaskProgressContextType {
  // Progress state
  taskCompletionStatus: Record<string, Record<number, boolean>>;
  isLoadingTaskProgress: boolean;

  // Progress actions
  markTaskCompleted: (taskIndex: number, testCasesPassed?: number, totalTestCases?: number) => Promise<void>;
  recordAttempt: (taskIndex: number, testCasesPassed: number, totalTestCases: number) => Promise<void>;

  // Progress queries
  isTaskCompleted: (taskIndex: number) => boolean;
  isTaskUnlocked: (taskIndex: number) => boolean;
  canGoToNext: () => boolean;
  getCompletionStats: () => { completed: number; total: number };
}

// Concept Map
export interface ConceptMapContextType {
  // Concept map state
  conceptMap: any;
  updateConceptMap: (newConceptMap: any) => void;
  conceptMapsPerMethod: Record<string, any>;
  isLoadingConceptMaps: boolean;

  // Concept map confidence and pivots
  conceptMapConfidenceMet: boolean;
  updateConceptMapConfidence: (isConfident: boolean) => void;
  latestPivotMessage: string | null;
  updateLatestPivotMessage: (message: string | null) => void;
  pivotQueue: Array<{ concept: string; category: string; confidence: number }>;
  updatePivotQueue: (queue: Array<{ concept: string; category: string; confidence: number }>) => void;
  conceptMapInitializing: boolean;
  updateConceptMapInitializing: (isInitializing: boolean) => void;

  // Conversation state
  conversationHistory: ConversationMessage[];
  updateConversationHistory: (newHistory: ConversationMessage[]) => Promise<void>;

  // Report state
  showReport: boolean;
  setShowReport: React.Dispatch<React.SetStateAction<boolean>>;

  // API update state
  isUpdatingConceptMap: boolean;
}
