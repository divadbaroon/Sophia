
export type VoiceState = 'initializing' | 'listening' | 'thinking' | 'speaking'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface StudentContext {
  task: string
  code: string
  errors: string
}

export interface SophiaBrainController {
  // Core state
  state: VoiceState
  error: string | null
  
  // Shared data
  conversationHistory: Message[]
  studentContext: StudentContext
  currentText: string // What Sophia is currently saying/thinking
  
  // State actions
  startListening: () => void
  startSpeaking: () => void
  startThinking: () => void
  setError: (error: string | null) => void
  
  // Data actions
  addMessage: (message: Message) => void
  updateStudentContext: (context: Partial<StudentContext>) => void
  setCurrentText: (text: string) => void
}

export interface SophiaWrapperProps {
  onClose: () => void
  transcript: string
  isTranscribing: boolean
  error: string | null
}