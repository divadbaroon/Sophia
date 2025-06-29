'use client'

import React, { useState, useCallback, useRef } from 'react'
import { SophiaBrainContext } from '../context/SophiaBrainContext'
import { 
  VoiceState, 
  Message, 
  SophiaBrainController 
} from '../types/SophiaBrainType'

import { saveMessage } from '@/lib/actions/message-actions'
import { MessageSave } from '@/types'
import { useFile } from '@/lib/context/FileContext'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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

  // Audio queue management
  const audioQueueRef = useRef<HTMLAudioElement[]>([])
  const currentAudioIndexRef = useRef<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
    
    // Stop any existing audio and reset queue
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    audioQueueRef.current = []
    currentAudioIndexRef.current = 0
    
    // Save user message
    addAndSaveMessage(userMessage, 'user')
    
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
      
      // For chunked TTS
      let ttsBuffer = ''
      const MIN_TTS_CHUNK_LENGTH = 50 // Reduced from 100 for faster first chunk
      let isProcessingComplete = false
      let ttsChunkCounter = 0 // Track chunk order
      let hasShownText = false // Track if we've shown text yet
      
      // Function to play audio queue
      const playNextAudio = async () => {
        const currentIndex = currentAudioIndexRef.current
        
        // Wait if the current audio isn't ready yet
        if (!audioQueueRef.current[currentIndex]) {
          // Check again in a bit
          setTimeout(() => playNextAudio(), 100)
          return
        }
        
        if (currentIndex >= audioQueueRef.current.length) {
          // All audio played
          if (isProcessingComplete) {
            setState('listening')
          }
          return
        }
        
        const currentAudio = audioQueueRef.current[currentIndex]
        
        // Skip null entries (failed chunks)
        if (!currentAudio) {
          currentAudioIndexRef.current++
          playNextAudio()
          return
        }
        
        audioRef.current = currentAudio
        
        // Show text on first audio play
        if (!hasShownText) {
          hasShownText = true
          setCurrentText(fullResponse)
          setState('speaking') // Change to speaking state when audio starts
          console.log('🎵 Audio started - showing text and changing to speaking state')
        }
        
        currentAudio.addEventListener('play', () => {
          console.log(`🎵 Playing audio chunk #${currentIndex}`)
        })
        
        currentAudio.addEventListener('ended', () => {
          URL.revokeObjectURL(currentAudio.src)
          currentAudioIndexRef.current++
          playNextAudio()
        })
        
        currentAudio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e)
          currentAudioIndexRef.current++
          playNextAudio()
        })
        
        try {
          await currentAudio.play()
        } catch (error) {
          console.error('Failed to play audio:', error)
          currentAudioIndexRef.current++
          playNextAudio()
        }
      }
      
      // Function to process TTS chunk
      const processTTSChunk = async (text: string, chunkIndex: number) => {
        if (!text.trim()) return
        
        console.log(`🔊 Processing TTS chunk #${chunkIndex}:`, text.substring(0, 50) + '...')
        
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ 
              text: text.trim(),
              voiceId: 'iDxgwKogoeR1jrVkJKJv'
            })
          })
          
          if (!response.ok) throw new Error(`TTS failed: ${response.status}`)
          
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          
          // Store audio at the correct index to maintain order
          audioQueueRef.current[chunkIndex] = audio
          
          // If this is the first audio and we're ready to play, start
          if (chunkIndex === 0 && currentAudioIndexRef.current === 0) {
            playNextAudio()
          }
          
        } catch (error) {
          console.error('TTS Error:', error)
          // Mark this chunk as failed so playback can continue
          audioQueueRef.current[chunkIndex] = null as any
        }
      }
      
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
                fullResponse += text
                ttsBuffer += text
                
                // Update currentText in real-time for the UI
                // Only show text after audio starts playing
                if (!hasShownText) {
                  // Don't show text yet
                } else {
                  setCurrentText(fullResponse)
                }
                
                // Start speaking state on first text chunk
                if (!hasStartedSpeaking && text.trim()) {
                  // Don't change state yet - wait for audio
                  // setState('speaking')
                  hasStartedSpeaking = true
                }
                
                // Check for natural break points (end of sentences)
                const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
                let hasBreakPoint = false
                let breakIndex = -1
                
                for (const ender of sentenceEnders) {
                  const index = ttsBuffer.lastIndexOf(ender)
                  if (index > 0 && index > breakIndex) {
                    breakIndex = index + ender.length - 1
                    hasBreakPoint = true
                  }
                }
                
                // For first chunk, be more aggressive - send after first sentence or comma
                if (ttsChunkCounter === 0 && ttsBuffer.length > 30) {
                  // Also check for commas for first chunk
                  const commaIndex = ttsBuffer.indexOf(', ')
                  if (commaIndex > 20) {
                    const firstChunk = ttsBuffer.substring(0, commaIndex + 1).trim()
                    ttsBuffer = ttsBuffer.substring(commaIndex + 1).trim()
                    processTTSChunk(firstChunk, ttsChunkCounter++)
                  } else if (hasBreakPoint) {
                    const chunkToSpeak = ttsBuffer.substring(0, breakIndex + 1).trim()
                    ttsBuffer = ttsBuffer.substring(breakIndex + 1).trim()
                    processTTSChunk(chunkToSpeak, ttsChunkCounter++)
                  }
                } else if (hasBreakPoint && ttsBuffer.length > MIN_TTS_CHUNK_LENGTH) {
                  // Normal chunk processing
                  const chunkToSpeak = ttsBuffer.substring(0, breakIndex + 1).trim()
                  ttsBuffer = ttsBuffer.substring(breakIndex + 1).trim()
                  processTTSChunk(chunkToSpeak, ttsChunkCounter++)
                }
                
              } catch (parseError) {
                // If it's not valid JSON, use the raw text
                console.warn('📢 JSON parse failed, using raw text', parseError)
                const text = jsonChunk
                fullResponse += text
                ttsBuffer += text
                
                // Only show text after audio starts
                if (hasShownText) {
                  setCurrentText(fullResponse)
                }
                
                if (!hasStartedSpeaking && text.trim()) {
                  // Don't change state yet - wait for audio
                  // setState('speaking')
                  hasStartedSpeaking = true
                }
              }
            }
          }
        }
        
        // Process any remaining text in buffer
        if (ttsBuffer.trim()) {
          await processTTSChunk(ttsBuffer.trim(), ttsChunkCounter++)
        }
        
        // Mark processing as complete
        isProcessingComplete = true
        
        // If no audio is playing, set state to listening
        if (audioQueueRef.current.length === 0) {
          setState('listening')
        }
      }
      
      // Save the complete assistant message
      if (fullResponse.trim()) {
        console.log('✅ Full Claude response:', fullResponse)
        addAndSaveMessage(fullResponse.trim(), 'assistant')
      }
      
    } catch (error) {
      console.error('❌ Error with Claude API:', error)
      setState('listening')
    }
    
  }, [addAndSaveMessage, studentContext])
  
  const handleSetCurrentText = useCallback((text: string) => {
    setCurrentText(text)
  }, [])
  
  // Stop all audio playback
  const stopAllAudio = useCallback(() => {
    console.log('🛑 Stopping all audio playback')
    
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // Clear audio queue
    audioQueueRef.current.forEach(audio => {
      if (audio) {
        audio.pause()
        // Clean up object URLs
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src)
        }
      }
    })
    
    // Reset queue
    audioQueueRef.current = []
    currentAudioIndexRef.current = 0
    
    // Reset to listening state
    setState('listening')
    setCurrentText('')
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
    stopAllAudio, 
    
    // Data actions
    setCurrentText: handleSetCurrentText
  }
  
  return (
    <SophiaBrainContext.Provider value={controller}>
      {children}
    </SophiaBrainContext.Provider>
  )
}