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

const ELEVENLABS_VOICE_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'iDxgwKogoeR1jrVkJKJv'
const ELEVENLABS_API_KEY =
  process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ''

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

  const [state, setState] = useState<VoiceState>('initializing')
  const [error, setError] = useState<string | null>(null)

  const conversationHistoryRef = useRef<Message[]>([])
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const studentContext = {
    fileContent: fileContent || '',
    errorContent: errorContent || '',
    studentTask:  studentTask  || '',
    executionOutput: executionOutput || '',
    highlightedText: highlightedText || '',
    lineNumber
  }

  const [currentText, setCurrentText] = useState<string>('')

  const startListening = useCallback(() => {
    setState('listening')
    setCurrentText('')
    setError(null)
  }, [])

  const startSpeaking = useCallback(() => {
    setState('speaking')
    setError(null)
  }, [])

  const handleSetError = useCallback((newErr: string | null) => {
    setError(newErr)
    if (newErr) setState('listening')
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setState('listening')
  }, [])

  const addAndSaveMessage = useCallback(
    async (content: string, role: 'user' | 'assistant') => {
      const msg: Message = { role, content, timestamp: Date.now() }
      const newHist = [...conversationHistoryRef.current, msg]
      conversationHistoryRef.current = newHist
      setConversationHistory(newHist)

      try {
        const payload: MessageSave = { sessionId, classId, content, role }
        const res = await saveMessage(payload)
        if (!res.success) console.error('Failed to save message', res.error)
      } catch (e) {
        console.error('Error saving message', e)
      }
    },
    [sessionId, classId]
  )

  const startThinking = useCallback(
    async (userMessage: string) => {
      stopAudio()
      setState('thinking')
      setCurrentText('')
      setError(null)

      addAndSaveMessage(userMessage, 'user')

      try {
        const claudeMsgs = conversationHistoryRef.current.map(({ role, content }) => ({ role, content }))
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: claudeMsgs, context: studentContext })
        })
        if (!res.ok) throw new Error('Failed to get Claude response')

        const reader  = res.body?.getReader()
        const decoder = new TextDecoder()
        let   full    = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk  = decoder.decode(value, { stream: true })
            chunk.split('\n').forEach(line => {
              if (line.startsWith('0:')) {
                const json = line.slice(2)
                try { full += JSON.parse(json) } catch { full += json }
              }
            })
          }
        }

        full = full.trim()
        if (!full) return setState('listening')

        addAndSaveMessage(full, 'assistant')

        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
          {
            method: 'POST',
            headers: {
              Accept: 'audio/mpeg',
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: full,
              model_id: 'eleven_multilingual_v2',
              output_format: 'mp3_44100_128',
              voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
          }
        )
        if (!ttsRes.ok) throw new Error('TTS failed')

        const audioBlob = await ttsRes.blob()
        const audioUrl  = URL.createObjectURL(audioBlob)
        const audio     = new Audio(audioUrl)
        audioRef.current = audio

        audio.onplay  = () => {
          setState('speaking')
          setCurrentText(full)
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
      } catch (err) {
        console.error('Error in startThinking:', err)
        setState('listening')
      }
    },
    [addAndSaveMessage, studentContext, stopAudio]
  )

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
