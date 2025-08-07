
export interface KnowledgeState {
  understandingLevel: number;
  confidenceInAssessment: number;
  reasoning: string;
  lastUpdated: string;
}

export interface Subconcept {
  name: string;
  value: number;
  knowledgeState: KnowledgeState;
}

export interface ConceptMap {
  categories: {
    [category: string]: {
      [subcategory: string]: Subconcept;
    };
  };
}

export interface TaskData {
  tasks: TaskProps[]
  methodTemplates: Record<string, string>
  testCases: Record<string, TestCase[]>
  conceptMappings: Record<number, string[]>
  conceptMap?: ConceptMap 
  system: string
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TestCase {
  input: {
    nums: number[],
    target: number
  },
  expected: number[]
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';  
  content: string;
  timestamp?: number;  
}

export interface User {
  email?: string
  id: string
  name?: string
}

export interface DemographicData {
  name?: string
  age: string
  gender: string
  ethnicity?: string
  education: string
  major: string
  programmingExperience?: string
  yearsOfExperience: string
}

export interface DemographicFormProps {
  isOpen: boolean
  onSubmit: () => void
  classId: string
}

export interface CodeError {
  sessionId: string
  lessonId: string
  taskIndex: number
  errorMessage: string
}

export interface TestCaseResult {
  testCaseIndex: number
  testInput: any
  expectedOutput: any
  actualOutput?: any
  passed: boolean
  errorMessage?: string
  executionTimeMs?: number
}

export interface TestRunResults {
  sessionId: string
  lessonId: string
  taskIndex: number
  methodId: string
  testCaseResults: TestCaseResult[]
}

export interface CodeSave {
  sessionId: string
  lessonId: string
  taskIndex: number
  methodId: string
  codeContent: string
}

export interface MessageSave {
  sessionId: string
  classId: string
  content: string
  role?: 'user' | 'assistant'
}

export interface SophiaInteractionEvent {
  sessionId: string
  lessonId: string
  currentTaskIndex: number
  interactionType: 'open' | 'close'
}

export interface NavigationEvent {
  sessionId: string
  lessonId: string
  fromTaskIndex: number
  toTaskIndex: number
  navigationDirection: 'next' | 'previous'
}

export interface CodeEditorRef {
  highlightLine: (lineNumber: number) => void;
  clearHighlight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  saveCode: () => Promise<void>;
}

export type CodeEditorProps = {
  className?: string;
  readOnly?: boolean;
};


