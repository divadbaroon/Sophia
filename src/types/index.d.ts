
export interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

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

export interface TaskProps {
  id: string 
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  description: string
  examples: Example[]
  constraints: string[]
}

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepgramContextType {
  isStarted: boolean;
  setIsStarted: (value: boolean) => void;
  transcript: string;
  conversationHistory: ClaudeMessage[];
  isRecording: boolean;
  isSpeaking: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearError: () => void;
}

export interface LiveTranscriptionResponse {
  is_final: boolean;
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence?: number;
    }>;
  };
}

export interface TestCase {
  input: {
    nums: number[],
    target: number
  },
  expected: number[]
}

// Define streaming interfaces
export interface StreamingSentence {
  text: string;
  complete: boolean;
  timestamp: number;
}

export interface ConversationManagerOptions {
  silenceThreshold: number; // ms before considering speech complete
  deepgramApiKey: string;
  fileContext?: FileContextType | null;
}

export interface LiveTranscriptionResponse {
  channel: {
    alternatives: {
      transcript: string;
    }[];
  };
  is_final: boolean;
}

export enum ConversationStatus {
  IDLE = 'idle',           // No active processing or speaking
  PROCESSING = 'processing', // System is processing/generating a response
  SPEAKING = 'speaking'    // System is speaking the response
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type VoiceCircleState = 
    "error" 
  | "idle" 
  | "listening" 
  | "thinking" 
  | "speaking" 
  | "initializing";

export interface TranscriptData {
  text: string
  timestamp: number
}

export type TranscriptFinalizedCallback = (data: TranscriptData) => void
export type TranscriptFinalizedSubscription = (callback: TranscriptFinalizedCallback) => () => void

export interface QuestionPanelProps {
  onBack?: () => void;
  onLineDetected?: (lineNumber: number) => void;
  onClearHighlight?: () => void;
  methodId?: string;
  onReadyForTA?: () => void;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';  
  content: string;
  timestamp?: number;  
}

export interface RecognitionDisplayProps {
  transcript: string | null
  status: ConversationStatus 
  isUserSpeaking: boolean
  bargeInDetected: boolean
  conversationHistory: ConversationMessage[] | null
  showInitialGreeting: boolean
  getLatestAssistantMessage: () => string | null
  voiceState: VoiceCircleState
}

export interface TranscriptHistoryProps {
  conversationHistory: ConversationMessage[] | null
}

export interface WordTiming {
  word: string;
  start: number; // milliseconds from start
  end: number;   // milliseconds from start
}

export interface StreamingMessage {
  text: string;
  wordTimings?: WordTiming[];
}

export interface ConversationState {
  transcript: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  currentStreamingMessage: StreamingMessage | null; 
  error: string | null;
  autoTTS: boolean;
  status: ConversationStatus;
}

export interface RecognitionDisplayProps {
  transcript: string;
  status: ConversationStatus;
  isUserSpeaking: boolean;
  bargeInDetected: boolean;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  showInitialGreeting: boolean;
  getLatestAssistantMessage: () => string | null;
  voiceState: VoiceCircleState;
  currentStreamingMessage?: StreamingMessage | null;
}

export interface ElevenLabsWordInfo {
  word: string;
  start: number; // Time in seconds when word starts
  end: number;   // Time in seconds when word ends
}

export const wordTimings = responseData.alignment.words.map((wordInfo: ElevenLabsWordInfo) => ({
  word: wordInfo.word,
  start: wordInfo.start * 1000, // Convert to milliseconds
  end: wordInfo.end * 1000     // Convert to milliseconds
}));

export interface ReasoningByKey {
  [key: string]: string;
}

export interface CustomReasoningMap {
  [timeIndex: number]: ReasoningByKey;
}

export interface User {
  email?: string
  id: string
  name?: string
}

export type NavItem = {
  name: string
  href: string
}

export type NavigationProps = {
  user: User | null
}

export interface UserProgress {
  completedConcepts: string[]
  totalXP: number
  currentStreak?: number
  achievements?: Achievement[]
  level: number
}

export interface ConceptProgress {
  conceptId: string
  completed: boolean
  xpEarned: number
  completedAt?: Date
  quizScore?: number
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

export interface TaskSidebarProps {
  isQuizModalOpen: boolean;
  setIsQuizModalOpen: (open: boolean) => void;
  isSurveyModalOpen: boolean;
  setIsSurveyModalOpen: (open: boolean) => void;
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

export interface Branch {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface MainConcept {
  id: string;
  name: string;
  x: number;
  y: number;
  branches: Branch[];
}

export interface Connection {
  from: MainConcept | Branch;
  to: Branch;
  id: string;
}

export type ConceptItem = MainConcept | Branch;
