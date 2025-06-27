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
  
  const startThinking = useCallback(async (userMessage: string) => {
    console.log('🤔 Sophia: Starting to think...')
    setState('thinking')
    setCurrentText('')
    setError(null)
    
    try {
      // Call Claude API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory.slice(-10),
          context: studentContext,
          currentMessage: userMessage  
        })
      })
      
      if (!response.ok) throw new Error('Failed to get response')
      
      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedResponse = ''
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                console.log(accumulatedResponse)
                // Add assistant message to history
                addMessage({
                  role: 'assistant',
                  content: accumulatedResponse,
                  timestamp: Date.now()
                })
                setState('listening') // Return to listening
              } else {
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.text) {
                    accumulatedResponse += parsed.text
                    setCurrentText(accumulatedResponse)
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calling Claude:', error)
      handleSetError('Failed to process your question')
    }
  }, [conversationHistory, studentContext, addMessage, handleSetError])
  
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