'use client'

import { useRef, useState, useCallback } from 'react'

export const DeepgramTranscriber= () => {
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startTranscription = useCallback(async () => {
    if (isTranscribing) return
    
    try {
      setError(null)
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
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-3', [
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
      }

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data)
        const result = received.channel?.alternatives?.[0]?.transcript
        
        if (result && result.trim()) {
          console.log('🗣️ Sophia heard:', result)
          
          setTranscript((prev) => prev + ' ' + result);
        }
      }

      socket.onerror = (error) => {
        console.error('❌ Sophia WebSocket error:', error)
        setError('Connection failed')
      }

      socket.onclose = (event) => {
        console.log('🔌 Sophia WebSocket closed:', event.code)
        if (event.code !== 1000) {
          setError(`Connection closed unexpectedly (${event.code})`)
        }
      }

      setIsTranscribing(true)
      
    } catch (err) {
      console.error('❌ Failed to start Sophia:', err)
      setError((err as Error).message)
    }
  }, [isTranscribing])

  const stopTranscription = useCallback(() => {
    console.log('🛑 Stopping Sophia transcription')
    
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(track => track.stop())
    socketRef.current?.close()
    
    setIsTranscribing(false)
    setTranscript('')
  }, [])

  return {
    transcript,
    isTranscribing,
    error,
    startTranscription,
    stopTranscription
  }
}