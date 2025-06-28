'use client'

import React, { useState, useCallback, useRef } from 'react'
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
  const { 
    sessionId, 
    lessonId: classId,
    fileContent,
    errorContent, 
    studentTask,
    executionOutput,
    highlightedText,
    lineNumber
  } = useFile()
  

  // Core state
  const [state, setState] = useState<VoiceState>('initializing')
  const [error, setError] = useState<string | null>(null)
  
  // Conversation History - use both state (for UI) and ref (for logic)
  const conversationHistoryRef = useRef<Message[]>([])
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])

  // Build student context dynamically from file context
  const studentContext = {
    fileContent: fileContent || '',
    errorContent: errorContent || '',
    studentTask: studentTask || '',
    executionOutput: executionOutput || '',
    highlightedText: highlightedText || '',
    lineNumber: lineNumber
  }

  console.log("STUDENT CONTEXT", studentContext)

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
    
    // Update both ref (for immediate access) and state (for UI)
    const newHistory = [...conversationHistoryRef.current, message]
    conversationHistoryRef.current = newHistory
    setConversationHistory(newHistory)
    
    console.log(`💬 Sophia: Adding ${message.role} message:`, message.content.substring(0, 100) + '...')
    console.log(`💬 Total messages now: ${newHistory.length}`)
    
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
    console.log('🔥 Function recreated! Current history length:', conversationHistoryRef.current.length)
    
    setState('thinking')
    setCurrentText('')
    setError(null)
    
    // Save user message
    await addAndSaveMessage(userMessage, 'user')
    
    try {
      // Use the ref which is always current
      const currentHistory = conversationHistoryRef.current
      
      console.log('📚 Using conversation history:', currentHistory.length, 'messages')
      console.log('📚 Full current history:', currentHistory)
      
      const claudeMessages = currentHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      console.log('📤 Final Claude messages:', claudeMessages.length, 'messages')
      console.log('📤 Final Claude messages detail:', claudeMessages)
        
      // Call Claude AI SDK 
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: claudeMessages,
          context: studentContext 
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
      console.error('❌ Error with Claude API:', error)
      setState('listening')
    }
    
  }, [addAndSaveMessage, studentContext])
  
  const handleSetCurrentText = useCallback((text: string) => {
    setCurrentText(text)
  }, [])
  
  const controller: SophiaBrainController = {
    // Core state
    state,
    error,
    
    // Shared data - UI uses state, logic uses ref
    conversationHistory,
    studentContext,
    currentText,
    
    // State actions
    startListening,
    startSpeaking,
    startThinking,
    setError: handleSetError,
    
    // Data actions
    setCurrentText: handleSetCurrentText
  }
  
  return (
    <SophiaBrainContext.Provider value={controller}>
      {children}
    </SophiaBrainContext.Provider>
  )
}