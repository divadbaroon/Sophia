'use client'

import { useRef, useCallback } from 'react'
import { useSophiaBrain } from './hooks/useSophiaBrain'
import { saveMessage } from '@/lib/actions/message-actions'
import { MessageSave } from "@/types"
import { useFile } from '@/lib/context/FileContext'

export const DeepgramTranscriber = () => {
  const { sessionId, lessonId: classId } = useFile()
  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const finalTranscriptRef = useRef('')
  const silenceTimeoutRef = useRef<number | null>(null)

  const brain = useSophiaBrain()

  // Clear any existing silence timeout
  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }, [])

  // After 3s of silence, transition to thinking
  const startSilenceTimeout = useCallback(() => {
    clearSilenceTimeout()

    silenceTimeoutRef.current = window.setTimeout(async () => {
      const transcript = finalTranscriptRef.current.trim()
      if (!transcript) return

      // 1) Prepare the user’s message
      const payload: MessageSave = {
        sessionId,
        classId,
        content: transcript,
        role: 'user',
      }
      const result = await saveMessage(payload)
      if (!result.success) {
        console.error('Failed to save message:', result.error)
      }

      // 2) Now flip the UI into “thinking”
      brain.startThinking()
    }, 3000)
  }, [clearSilenceTimeout, sessionId, classId, brain])

  const startTranscription = useCallback(async () => {
    if (brain.state === 'listening') return

    try {
      brain.setError(null)
      console.log('🚀 Starting Sophia transcription…')

      finalTranscriptRef.current = ''
      clearSilenceTimeout()

      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
      if (!apiKey) throw new Error('Deepgram API key not configured')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-3&interim_results=true',
        ['token', apiKey]
      )
      socketRef.current = socket

      socket.onopen = () => {
        console.log('✅ WebSocket connected')
        mediaRecorder.addEventListener('dataavailable', (e) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(e.data)
          }
        })
        mediaRecorder.start(250)
        brain.startListening()
      }

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data)
        const result = received.channel?.alternatives?.[0]?.transcript
        const isFinal = received.is_final

        if (result && result.trim()) {
          if (isFinal) {
            // accumulate full transcript
            finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + result

            // **immediately add each final chunk to history**
            brain.addMessage({
              role: 'user',
              content: result,
              timestamp: Date.now(),
            })

            // update display
            brain.setCurrentText(finalTranscriptRef.current)

            // start silence timer for processing
            startSilenceTimeout()
          } else {
            // interim result: show live preview and reset timer
            const preview =
              finalTranscriptRef.current +
              (finalTranscriptRef.current ? ' ' : '') +
              result
            brain.setCurrentText(preview)
            clearSilenceTimeout()
          }
        }
      }

      socket.onerror = (err) => {
        console.error('❌ WebSocket error:', err)
        brain.setError('Connection failed')
        clearSilenceTimeout()
      }

      socket.onclose = (event) => {
        console.log('🔌 WebSocket closed with code', event.code)
        clearSilenceTimeout()
        // ignore normal (1000) and no-status (1005)
        if (event.code !== 1000 && event.code !== 1005) {
          brain.setError(`Connection closed unexpectedly (${event.code})`)
        }
      }
    } catch (err) {
      console.error('❌ Failed to start transcription:', err)
      brain.setError((err as Error).message)
      clearSilenceTimeout()
    }
  }, [brain, startSilenceTimeout, clearSilenceTimeout])

  const stopTranscription = useCallback(() => {
    console.log('🛑 Stopping transcription')
    clearSilenceTimeout()
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    // clean close
    socketRef.current?.close(1000)
    finalTranscriptRef.current = ''
    brain.setCurrentText('')
  }, [brain, clearSilenceTimeout])

  return {
    startTranscription,
    stopTranscription,
    transcript: brain.currentText,
    isTranscribing: brain.state === 'listening',
    error: brain.error,
  }
}
