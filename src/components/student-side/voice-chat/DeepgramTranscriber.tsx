'use client'

import { useRef, useCallback } from 'react'
import { useSophiaBrain } from './hooks/useSophiaBrain'

export const DeepgramTranscriber = () => {
  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const finalTranscriptRef = useRef('')

  const brain = useSophiaBrain()

  const startTranscription = useCallback(async () => {
    if (brain.state === 'listening') return
    
    try {
      brain.setError(null)
      console.log('🚀 Starting Sophia transcription...')
      
      // Get API key
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
      if (!apiKey) {
        throw new Error('Deepgram API key not configured')
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      // Create WebSocket
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-3&interim_results=true', [
        'token',
        apiKey
      ])
      socketRef.current = socket

      socket.onopen = () => {
        console.log('✅ Sophia WebSocket connected')
        
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data)
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
          console.log('🗣️ Sophia heard:', result)
          
          if (isFinal) {
            // Final transcript - add to conversation history
            finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + result
            
            // Add as user message to conversation history
            brain.addMessage({
              role: 'user',
              content: result,
              timestamp: Date.now() 
            })
            
            // Update current text to show full transcript so far
            brain.setCurrentText(finalTranscriptRef.current)
          } else {
            // For interim results, just accumulate and update display
            const fullTranscript = finalTranscriptRef.current + (finalTranscriptRef.current ? ' ' : '') + result
            brain.setCurrentText(fullTranscript)
          }
        }
      }

      socket.onerror = (error) => {
        console.error('❌ Sophia WebSocket error:', error)
        brain.setError('Connection failed')
      }

      socket.onclose = (event) => {
        console.log('🔌 Sophia WebSocket closed:', event.code)
        if (event.code !== 1000) {
          brain.setError(`Connection closed unexpectedly (${event.code})`)
        }
      }
      
    } catch (err) {
      console.error('❌ Failed to start Sophia:', err)
      brain.setError((err as Error).message)
    }
  }, [brain])

  const stopTranscription = useCallback(() => {
    console.log('🛑 Stopping Sophia transcription')
    
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(track => track.stop())
    socketRef.current?.close()
    
    // Reset transcript accumulator
    finalTranscriptRef.current = ''
    
    // Clear current text and reset brain state
    brain.setCurrentText('')
    
    // Could transition to thinking state here if you want to process the conversation
    // brain.startThinking()
    
  }, [brain])

  // Return simple interface - brain context handles all the state
  return {
    startTranscription,
    stopTranscription,
    // For backward compatibility, expose brain state
    transcript: brain.currentText,
    isTranscribing: brain.state === 'listening',
    error: brain.error
  }
}