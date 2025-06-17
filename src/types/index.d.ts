// ====== COURSE
export interface Course {
  id: string
  name: string
  code: string
}

// ====== LOCATION
export interface Location {
  type: "physical" | "virtual" | "hybrid"
  details: string
}

// ====== METRICS
export interface ActiveMetrics {
  currentQueue: number
  totalHelped: number
  averageWaitTime: number
  activeTime: number
}

export interface PastMetrics {
  studentsHelped: number
  averageWaitTime: number
  peakQueueSize: number
  totalDuration: number
  actualStartTime: string
  actualEndTime: string
  topicsCovered: string[]
  commonIssues: string[]
  conceptualBreakthroughs: number
  studentSatisfaction: number
}

// ====== DISCUSSION
export interface Discussion {
  topics: string[]
  prerequisites: string[]
  materials: string[]
  preparation: string
}

// ====== RECURRING
export interface Recurring {
  frequency: "weekly" | "biweekly" | "monthly"
  endDate: string
}

// ====== FEEDBACK
export interface Feedback {
  averageRating: number
  responses: number
  comments?: string[]
  improvements?: string[]
}

// ====== STUDENT
export interface Student {
  id: number
  name: string
  waitTime: string
  conceptGaps: string[]
  status: "In Queue" | "In Progress" | "Completed"
  joinedAt: string
  avatar?: string
  preferredName?: string
  course?: string
  previousVisits?: number
}

// ====== SESSION
export interface BaseSession {
  id: number
  name: string
  course: Course
  duration: number
  location: Location
}

export interface ActiveSession extends BaseSession {
  status: "active"
  date: string
  time: string
  metrics?: {
    currentQueue: number
    totalHelped: number
    averageWaitTime: number
    activeTime: number
  }
}

export interface ActiveSessionsProps {
  sessions: ActiveSession[]
  isLoading: boolean
  onNewClick?: () => void
}

export interface UpcomingSession extends BaseSession {
  status: "upcoming"
  date: string
  time: string
  expectedAttendees?: number
  description?: string
  recurring?: Recurring
  discussion?: Discussion
}

export interface UpcomingSessionsProps {
  sessions: UpcomingSession[]
  isLoading: boolean
  onUpdate: () => void
  onNewClick?: () => void
}

export interface PastSession extends BaseSession {
  status: "past"
  date: string
  time: string
  metrics: PastMetrics
  feedback?: Feedback
}

export interface PastSessionsProps {
  sessions: PastSession[]
  isLoading: boolean
}

export type Session = ActiveSession | UpcomingSession | PastSession

// ====== DASHBOARD CREATE SESSION
export interface CreateSessionProps {
  onCancel: () => void
  onSuccess: () => void
}

export interface CreateSessionFormData {
  name: string
  course: Course
  description?: string
  date: string
  duration: number
  location: Location
}

// ====== DASHBOARD SEARCH
export interface SearchHeaderProps {
  title: string
  description: string
  showNewButton?: boolean
  onNewClick?: () => void
  filterOptions: {
    value: string
    label: string
  }[]
}

// ====== DASHBOARD CARD
export interface SessionCardProps {
  type: "active" | "upcoming" | "past"
  data: Session
  onUpdate?: {
    active?: (session: ActiveSession) => void
    upcoming?: (session: UpcomingSession) => void
    past?: (session: PastSession) => void
  }
}

// ====== DASHBOARD SIDEBAR
export interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

// ====== MODAL
export interface SessionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session
}

export interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  session: UpcomingSession
  onUpdate: (updatedSession: UpcomingSession) => void
}

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

export interface TestCase {
  input: Record<string, any>
  expected: any
  methodId?: string
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

// Then update the TaskData interface to include the conceptMap
export interface TaskData {
  tasks: TaskSidebarProps[]
  methodTemplates: Record<string, string>
  testCases: Record<string, TestCase[]>
  conceptMappings: Record<number, string[]>
  conceptMap?: ConceptMap  // Optional property with the ConceptMap type
  system: string
}

export interface FileContextType {
  selectedFile: string | null
  fileContent: string
  filePath: string | null
  selectFile: (fileName: string, content: string, path: string) => void
  cachedFileContent: string
  updateCachedFileContent: (content: string) => void
  setFileContent: React.Dispatch<React.SetStateAction<string>>
  errorContent: string
  setErrorContent: React.Dispatch<React.SetStateAction<string>>
  executionOutput: string
  updateExecutionOutput: (output: string) => void
  isSaved: () => boolean
  fileNode: FileSystemNode | null
  setFileNode: React.Dispatch<React.SetStateAction<FileSystemNode | null>>
  highlightedText: string
  updateHighlightedText: (text: string) => void
  studentTask: string
  updateStudentTask: (task: string) => void
  speakTo: 'student' | 'ta'
  updateSpeakTo: (role: 'student' | 'ta') => void
  scenario: 'one-on-one' | 'group'
  updateScenario: (newScenario: 'one-on-one' | 'group') => void
  lineNumber: number | null
  updateLineNumber: (line: number | null) => void
  conceptMapConfidenceMet: boolean
  updateConceptMapConfidence: (isConfident: boolean) => void
  latestPivotMessage: string | null
  updateLatestPivotMessage: (message: string | null) => void
  
  // Task-related properties
  sessionId: string
  sessionData: TaskData
  currentMethodIndex: number
  activeMethodId: string
  currentTestCases: TestCase[]
  goToNextMethod: () => void
  goToPrevMethod: () => void
  getCurrentMethodTemplate: () => string
  getAllMethodTemplates: () => Record<string, string>

  conversationHistory: ConversationMessage[];
  updateConversationHistory: (newHistory: ConversationMessage[]) => void;
  conceptMap: any; // Update this with a more specific type if available
  updateConceptMap: (newConceptMap: any) => void;

  showReport: boolean;
  setShowReport: React.Dispatch<React.SetStateAction<boolean>>;
  
  // System type properties
  systemType: 'ATLAS' | 'Standalone';
  updateSystemType: (type: 'ATLAS' | 'Standalone') => void;

  pivotQueue?: Array<{concept: string, category: string, confidence: number}> | null;
  updatePivotQueue?: (queue: Array<{concept: string, category: string, confidence: number}>) => void;


  conceptMapInitializing: boolean;
  updateConceptMapInitializing: (isInitializing: boolean) => void;
}

export type FolderContextType = {
  selectedFolder: string | null;
  fileStructure: FileSystemNode[];
  setSelectedFolder: (folderName: string | null) => void;
  setFileStructure: (structure: FileSystemNode[]) => void;
};

export interface VideoChatContextType {
  role: RoleType;
  setRole: (role: RoleType) => void;
  chatId: string;
  setChatId: (id: string) => void;
  receiverId: string;
  setReceiverId: (id: string) => void;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TaskSidebarProps {
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
  | "idle" 
  | "listening" 
  | "processing" 
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


// Settings related types
export type SpeakToOption = 'student' | 'ta'
export type ScenarioOption = 'one-on-one' | 'group'

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

export interface RecognitionSettingsProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  speakTo: SpeakToOption
  scenario: ScenarioOption
  onSave: (speakTo: SpeakToOption, scenario: ScenarioOption) => void
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

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
}

export interface ConceptProgress {
  conceptId: string
  completed: boolean
  xpEarned: number
  completedAt?: Date
  quizScore?: number
}
