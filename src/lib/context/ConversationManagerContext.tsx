'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useConversationManager } from '@/lib/hooks/useConversationManager'
import { ClaudeMessage } from '@/types'
import { StreamingMessage, StreamingSentence } from '@/lib/services/ConversationManager'

// Define the shape of the context
export interface ConversationManagerContextType {
  // State
  isRecording: boolean
  isSpeaking: boolean
  isProcessing: boolean
  transcript: string
  conversationHistory: ClaudeMessage[]
  currentStreamingMessage: StreamingMessage | null
  error: string | null
  autoTTS: boolean
  
  // Methods
  startRecording: () => void
  stopRecording: () => void
  queryClaudeWithText: (text: string) => void
  toggleAutoTTS: () => void
  speakLastResponse: () => void
  stopSpeaking: () => void
  clearError: () => void
  analyzeCode: (code: string) => void
  
  // Streaming event subscriptions
  onSentenceAdded: (callback: (data: {
    messageId: string, 
    sentence: StreamingSentence
  }) => void) => () => void
  
  onMessageCompleted: (callback: (data: {
    messageId: string, 
    content: string, 
    sentences: StreamingSentence[], 
    duration: number
  }) => void) => () => void
}

// Create the context
const ConversationManagerContext = createContext<ConversationManagerContextType | undefined>(undefined)

// Provider component
export const ConversationManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const conversationManager = useConversationManager()
  
  return (
    <ConversationManagerContext.Provider value={conversationManager}>
      {children}
    </ConversationManagerContext.Provider>
  )
}

// Hook to use the conversation manager context
export const useConversationManagerContext = (): ConversationManagerContextType => {
  const context = useContext(ConversationManagerContext)
  
  if (context === undefined) {
    throw new Error('useConversationManagerContext must be used within a ConversationManagerProvider')
  }
  
  return context
}