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

interface TestCase {
  input: {
    nums: number[],
    target: number
  },
  expected: number[]
}

export interface FileContextType {
  selectedFile: string | null
  fileContent: string
  filePath: string | null
  selectFile: (fileName: string, content: string, path: string) => void
  cachedFileContent: string
  updateCachedFileContent: (content: string) => void
  setFileContent: (content: string) => void
  errorContent: string
  setErrorContent: (error: string) => void
  executionOutput: string
  updateExecutionOutput: (output: string) => void
  isSaved: () => boolean
  fileNode: FileSystemNode | null
  setFileNode: (node: FileSystemNode | null) => void
  highlightedText: string
  updateHighlightedText: (text: string) => void
  testCases: TestCase[]
  updateTestCases: (newTestCases: TestCase[]) => void
  studentTask: string
  updateStudentTask: (task: string) => void
  speakTo: 'student' | 'ta'
  updateSpeakTo: (role: 'student' | 'ta') => void
  scenario: 'one-on-one' | 'group'
  updateScenario: (scenario: 'one-on-one' | 'group') => void
  lineNumber: number | null
  updateLineNumber: (line: number | null) => void
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

export interface StreamingMessage {
  id: string;
  role: 'assistant';
  sentences: StreamingSentence[];
  content: string; // The complete message content, updated as sentences come in
  isComplete: boolean;
  startTimestamp: number;
  endTimestamp: number | null;
}

// Conversation options
export interface ConversationManagerOptions {
  silenceThreshold: number; // ms before considering speech complete
  deepgramApiKey: string;
  fileContext?: FileContextType | null;
}

// Conversation state
export interface ConversationState {
  isRecording: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  conversationHistory: ClaudeMessage[];
  currentStreamingMessage: StreamingMessage | null;
  error: string | null;
  autoTTS: boolean;
}