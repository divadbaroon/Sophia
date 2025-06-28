'use client'

import React, { useState, useCallback } from 'react'
import { SophiaBrainContext } from './context/SophiaBrainContext'
import { 
  VoiceState, 
  Message, 
  StudentContext, 
  SophiaBrainController 
} from './types/SophiaBrainType'

import { saveMessage } from '@/lib/actions/message-actions'
import { MessageSave } from '@/types'
import { useFile } from '@/lib/context/FileContext'

export const SophiaBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionId, lessonId: classId } = useFile()

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

  // Current text showing on the wrapper
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
      setState('listening')
    }
  }, [])
  
  // Save message to conversation history and then save it in the db
  const addAndSaveMessage = useCallback(async (content: string, role: 'user' | 'assistant') => {
    // Prepare the message
    const message: Message = {
      role,
      content,
      timestamp: Date.now()
    }
    
    // Add to conversation history
    console.log(`💬 Sophia: Adding ${message.role} message:`, message.content.substring(0, 100) + '...')
    setConversationHistory(prev => [...prev, message])
    
    // Save to database
    try {
      const payload: MessageSave = {
        sessionId,
        classId,
        content,
        role
      }
      
      const saveRes = await saveMessage(payload)
      
      if (!saveRes.success) {
        console.error(`❌ Failed to save ${role} message:`, saveRes.error)
      } else {
        console.log(`✅ Saved ${role} message to database`)
      }
    } catch (error) {
      console.error(`❌ Error saving ${role} message:`, error)
    }
    
    return message
  }, [sessionId, classId])
  
  const startThinking = useCallback(async (userMessage: string) => {
    console.log('🤔 Sophia: Starting to think about:', userMessage)
    setState('thinking')
    setCurrentText('')
    setError(null)
    
    // Save users input to conversation history and then save it in the db
    await addAndSaveMessage(userMessage, 'user')
    
    try {
      // Prepare the messages for Claude API including conversation history
      const updatedHistory = [...conversationHistory, {
        role: 'user' as const,
        content: userMessage,
        timestamp: Date.now()
      }]
      
      const claudeMessages = updatedHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      console.log('📤 Sending to Claude AI SDK:', claudeMessages.length, 'messages')
      
      // Call Claude AI SDK 
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: claudeMessages
        })
      })
      
      if (!response.ok) throw new Error('Failed to get Claude response')
      
      // Handle streaming response from AI SDK - accumulate and save
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = '' // Accumulate the complete response
      let hasStartedSpeaking = false // Track if we've started speaking state
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('0:')) {
              // AI SDK streaming format: "0:chunk of text"
              const jsonChunk = line.slice(2)
              
              try {
                // Parse the JSON to get the actual text
                const text = JSON.parse(jsonChunk)
                console.log('📢 Streamed text:', text)
                fullResponse += text // Accumulate each chunk
                
                // Update currentText in real-time for the UI
                setCurrentText(fullResponse)
                
                // Start speaking state on first text chunk
                if (!hasStartedSpeaking && text.trim()) {
                  setState('speaking')
                  hasStartedSpeaking = true
                }
              } catch (parseError) {
                // If it's not valid JSON, use the raw text
                console.warn('📢 JSON parse failed, using raw text:', parseError)
                const text = jsonChunk
                console.log('📢 Streamed text (raw):', text)
                fullResponse += text
                setCurrentText(fullResponse)
                
                if (!hasStartedSpeaking && text.trim()) {
                  setState('speaking')
                  hasStartedSpeaking = true
                }
              }
            }
          }
        }
      }
      
      // Add and save assistant message
      if (fullResponse.trim()) {
        console.log('✅ Full Claude response:', fullResponse)
        await addAndSaveMessage(fullResponse.trim(), 'assistant')
      }
      
      // Return to listening
      setState('listening')
      
    } catch (error) {
      console.error('❌ Error with Claude AI SDK:', error)
      setState('listening')
    }
    
  }, [
    conversationHistory,
    addAndSaveMessage, 
  ])
  
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
    updateStudentContext,
    setCurrentText: handleSetCurrentText
  }
  
  return (
    <SophiaBrainContext.Provider value={controller}>
      {children}
    </SophiaBrainContext.Provider>
  )
}