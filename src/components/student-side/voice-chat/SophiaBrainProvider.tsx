'use client'

import React, { useState, useCallback } from 'react'
import { SophiaBrainContext } from './context/SophiaBrainContext'
import { 
  VoiceState, 
  Message, 
  StudentContext, 
  SophiaBrainController 
} from './types/SophiaBrainType'

export const SophiaBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state
  const [state, setState] = useState<VoiceState>('initializing')
  const [error, setError] = useState<string | null>(null)
  
  // Shared data
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [studentContext, setStudentContext] = useState<StudentContext>({
    task: '',
    code: '',
    errors: ''
  })
  const [currentText, setCurrentText] = useState('')
  
  // State actions
  const startListening = useCallback(() => {
    console.log('🎤 Sophia: Starting to listen...')
    setState('listening')
    setCurrentText('')
    setError(null)
  }, [])
  
  const startSpeaking = useCallback(() => {
    console.log('🗣️ Sophia: Starting to speak...')
    setState('speaking')
    setError(null)
  }, [])
  
  const startThinking = useCallback(() => {
    console.log('🤔 Sophia: Starting to think...')
    setState('thinking')
    setCurrentText('')
    setError(null)
  }, [])
  
  const handleSetError = useCallback((newError: string | null) => {
    console.log('❌ Sophia: Error occurred:', newError)
    setError(newError)
    if (newError) {
      setState('listening') // Return to listening on error
    }
  }, [])
  
  // Data actions
  const addMessage = useCallback((message: Message) => {
    console.log(`💬 Sophia: Adding ${message.role} message:`, message.content)
    setConversationHistory(prev => [...prev, message])
  }, [])
  
  const updateStudentContext = useCallback((context: Partial<StudentContext>) => {
    console.log('📝 Sophia: Updating student context:', context)
    setStudentContext(prev => ({ ...prev, ...context }))
  }, [])
  
  const handleSetCurrentText = useCallback((text: string) => {
    setCurrentText(text)
  }, [])
  
  const controller: SophiaBrainController = {
    // Core state
    state,
    error,
    
    // Shared data
    conversationHistory,
    studentContext,
    currentText,
    
    // State actions
    startListening,
    startSpeaking,
    startThinking,
    setError: handleSetError,
    
    // Data actions
    addMessage,
    updateStudentContext,
    setCurrentText: handleSetCurrentText
  }
  
  return (
    <SophiaBrainContext.Provider value={controller}>
      {children}
    </SophiaBrainContext.Provider>
  )
}