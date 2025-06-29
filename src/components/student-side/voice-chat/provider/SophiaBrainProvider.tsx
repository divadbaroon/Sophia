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

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tlvlwydkkdxsgdqxzahc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const TTS_VOICE_ID = 'iDxgwKogoeR1jrVkJKJv'

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
  
  // Conversation History - state for UI, ref for logic
  const conversationHistoryRef = useRef<Message[]>([])
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])

  // Audio element ref for control
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Build student context
  const studentContext = {
    fileContent: fileContent || '',
    errorContent: errorContent || '',
    studentTask: studentTask || '',
    executionOutput: executionOutput || '',
    highlightedText: highlightedText || '',
    lineNumber: lineNumber
  }

  // Current text
  const [currentText, setCurrentText] = useState<string>('')

  // State actions
  const startListening = useCallback(() => {
    setState('listening')
    setCurrentText('')
    setError(null)
  }, [])
  
  const startSpeaking = useCallback(() => {
    setState('speaking')
    setError(null)
  }, [])

  const handleSetError = useCallback((newError: string | null) => {
    setError(newError)
    if (newError) {
      setState('listening')
    }
  }, [])
  
  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setState('listening')
  }, [])

  // Save message to history and DB
  const addAndSaveMessage = useCallback(async (content: string, role: 'user' | 'assistant') => {
    const message: Message = { role, content, timestamp: Date.now() }
    const newHistory = [...conversationHistoryRef.current, message]
    conversationHistoryRef.current = newHistory
    setConversationHistory(newHistory)

    try {
      const payload: MessageSave = { sessionId, classId, content, role }
      const saveRes = await saveMessage(payload)
      if (!saveRes.success) console.error('Failed to save message', saveRes.error)
    } catch (e) {
      console.error('Error saving message', e)
    }

    return message
  }, [sessionId, classId])
  
  // Thinking: call Claude, stream, then TTS
  const startThinking = useCallback(async (userMessage: string) => {
    // stop any playing audio
    stopAudio()

    // enter thinking state until audio plays
    setState('thinking')
    setCurrentText('')
    setError(null)
    
    // Save user message
    addAndSaveMessage(userMessage, 'user')

    try {
      // Prepare messages for Claude
      const claudeMessages = conversationHistoryRef.current.map(msg => ({ role: msg.role, content: msg.content }))

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: claudeMessages, context: studentContext })
      })
      if (!response.ok) throw new Error('Failed to get Claude response')

      // Stream reader
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const jsonChunk = line.slice(2)
              try {
                const text = JSON.parse(jsonChunk)
                fullResponse += text
              } catch {
                fullResponse += jsonChunk
              }
            }
          }
          // don't display text until audio plays
        }
      }

      fullResponse = fullResponse.trim()
      if (fullResponse) {
        addAndSaveMessage(fullResponse, 'assistant')

        // TTS via Supabase Edge
        const ttsRes = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ text: fullResponse, voiceId: TTS_VOICE_ID })
        })
        if (!ttsRes.ok) throw new Error('TTS failed')

        const audioBlob = await ttsRes.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        // switch to speaking and display text when playback begins
        audio.onplay = () => {
          setState('speaking')
          setCurrentText(fullResponse)
        }
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setState('listening')
        }
        audio.onerror = () => {
          console.error('Audio playback error')
          setState('listening')
        }
        await audio.play()
      }
    } catch (err) {
      console.error('Error in startThinking:', err)
      setState('listening')
    }
  }, [addAndSaveMessage, studentContext, stopAudio])
  
  const controller: SophiaBrainController = {
    state,
    error,
    conversationHistory,
    studentContext,
    currentText,
    startListening,
    startSpeaking,
    startThinking,
    setError: handleSetError,
    setCurrentText,
    stopAudio
  }

  return (
    <SophiaBrainContext.Provider value={controller}>
      {children}
    </SophiaBrainContext.Provider>
  )
}
