'use client'

import { useRef, useCallback } from 'react'
import { useSophiaBrain } from '../hooks/useSophiaBrain'

export const DeepgramTranscriber = () => {
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

      console.log('🎙️ Deepgram: Processing transcript:', transcript)

      // Clear existing transcription to avoid duplication
      finalTranscriptRef.current = ''
      brain.setCurrentText('')

      // initiate thinking
      await brain.startThinking(transcript)
    }, 3000)
  }, [clearSilenceTimeout, brain])

  const startTranscription = useCallback(async () => {
    try {
      brain.setError(null)
      console.log('🚀 Starting Sophia transcription…')

      // Reset transcript and timers
      finalTranscriptRef.current = ''
      brain.setCurrentText('')
      clearSilenceTimeout()

      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
      if (!apiKey) throw new Error('Deepgram API key not configured')

      // Request mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Start recording & socket
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
            finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + result
            console.log('🎙️ Final transcript segment:', result)

            brain.setCurrentText(finalTranscriptRef.current)
            startSilenceTimeout()
          } else {
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
        // Only treat as error if abnormal closure
        if (event.code !== 1000 && event.code !== 1005) {
          brain.setError(`Connection closed unexpectedly (${event.code})`)
        }
      }
    } catch (err) {
      console.error('❌ Failed to start transcription:', err)
      brain.setError((err as Error).message)
      clearSilenceTimeout()
    }
  }, [brain, clearSilenceTimeout, startSilenceTimeout])

  const stopTranscription = useCallback(() => {
    console.log('🛑 Stopping transcription')
    clearSilenceTimeout()

    // Stop recording
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())

    // Close socket cleanly
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close(1000)
    }

    // Clear refs
    socketRef.current = null
    mediaRecorderRef.current = null
    streamRef.current = null

    // Clear transcript
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
