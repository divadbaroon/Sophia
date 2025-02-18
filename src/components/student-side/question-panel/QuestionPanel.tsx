"use client";

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic, Bot } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { 
  useDeepgram, 
  SOCKET_STATES, 
  LiveTranscriptionEvents,
  type LiveTranscriptionEvent 
} from '@/components/audio/DeepgramContextProvider'
import { useFile } from '@/components/context/FileContext'
import { useElevenLabs } from '@/components/audio/ElevenLabsProvider';

interface QuestionPanelProps {
  onBack: () => void;
  isVisible?: boolean;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ onBack, isVisible = true }) => {
  // -----------------------------
  // 1) Load from localStorage (lazy initialization)
  // -----------------------------
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('conversationHistory')
      return savedHistory ? JSON.parse(savedHistory) : []
    }
    return []
  })

  const [currentQuestion, setCurrentQuestion] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastQuestion') || ''
    }
    return ''
  })

  // Keep track of the "transcript" as it's forming
  const [transcript, setTranscript] = useState<string>("")
  // Keep track of the real-time AI response as it streams
  const [aiResponse, setAiResponse] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  // State to control whether the user has started the conversation
  const [isStarted, setIsStarted] = useState(false)

  // ElevenLabs (TTS) states
  const { connectToVoice, disconnect, isConnected, error, isInitialized } = useElevenLabs()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  // The accumulated text for TTS
  const accumulatedTextRef = useRef<string>('')

  // Deepgram (STT) states
  const { connection, connectToDeepgram, connectionState, disconnectFromDeepgram } = useDeepgram()

  // Media recording states
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // For auto-scrolling the conversation
  const responseDivRef = useRef<HTMLDivElement>(null)

  // -----------------------------
  // 2) Sync to localStorage whenever conversation or question changes
  // -----------------------------
  useEffect(() => {
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory))
  }, [conversationHistory])

  useEffect(() => {
    localStorage.setItem('lastQuestion', currentQuestion)
  }, [currentQuestion])

  // Debug logging for voice integration
  useEffect(() => {
    console.log('Voice Integration Status:', {
      isConnected,
      isSpeaking,
      isInitialized,
      error
    })
  }, [isConnected, isSpeaking, isInitialized, error])

  // Get complete file context for code understanding
  const { 
    fileContent, 
    errorContent, 
    selectedFile,
    highlightedText,
    executionOutput,
    testCases
  } = useFile()

  // Debug logging for context changes
  useEffect(() => {
    console.log('File Context Update:', {
      fileContent,
      testCases,
      executionOutput,
      errorContent,
      highlightedText
    })
  }, [fileContent, testCases, executionOutput, errorContent, highlightedText])
  
  // Create and configure the MediaRecorder
  const createRecorder = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    })

    // Send audio data to Deepgram when available
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0 && connection && connectionState === SOCKET_STATES.open) {
        connection.send(e.data)
      }
    }

    mediaRecorderRef.current = recorder
    return recorder
  }

  // Handle media stream and recording state changes
  useEffect(() => {
    if (!mediaStream || !connection) return

    if (connectionState === SOCKET_STATES.open) {
      const recorder = createRecorder(mediaStream)
      recorder.start(250) // Start recording in 250ms chunks
    } else if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [connectionState, connection, mediaStream]) 

  // Handle Deepgram transcription events
  useEffect(() => {
    if (!connection) return

    const handleTranscript = (event: LiveTranscriptionEvent) => {
      if (event.is_final && event.channel?.alternatives?.[0]?.transcript) {
        const transcriptText = event.channel.alternatives[0].transcript
        if (transcriptText.trim()) {
          // If there's no current question in state, this is a new question
          if (!currentQuestion) {
            setCurrentQuestion(transcriptText.trim())
            setTranscript(transcriptText.trim())
            fetchAiResponse(transcriptText.trim())
          } else {
            // Otherwise, we are appending to the existing question
            const newTranscript = `${transcript} ${transcriptText}`.trim()
            setTranscript(newTranscript)
            setCurrentQuestion(newTranscript)

            // Only fetch new response if significantly different in length
            if (newTranscript.length > transcript.length + 5) {
              fetchAiResponse(newTranscript)
            }
          }
        }
      }
    }

    connection.addListener(LiveTranscriptionEvents.Transcript, handleTranscript)
    return () => {
      connection.removeListener(LiveTranscriptionEvents.Transcript, handleTranscript)
    }
  }, [connection, transcript, currentQuestion])

  // Main AI call
  const fetchAiResponse = async (text: string) => {
    if (!text.trim() || isProcessing) return
    
    try {
      setIsProcessing(true)
      setAiResponse("")
      accumulatedTextRef.current = ''
      setVoiceError(null)
      
      const questionBeingProcessed = text
      
      const contextData = {
        transcript: text,
        fileContext: {
          fileName: selectedFile,
          content: fileContent,
          errorMessage: errorContent,
          executionOutput: executionOutput,
          testCases: testCases,
          highlightedText: highlightedText
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextData),
      })
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response stream")
      }
  
      const decoder = new TextDecoder()
      let done = false
      let fullResponse = ""
      
      setIsSpeaking(true)

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          
          const lines = chunk.split('\n\n')
          for (const line of lines) {
            const match = line.match(/^data: (.+)$/m)
            if (!match) continue
            
            const data = match[1]
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullResponse += parsed.text
                setAiResponse(fullResponse)
                
                // Accumulate text for TTS
                accumulatedTextRef.current += parsed.text

                // Auto-scroll if needed
                if (responseDivRef.current) {
                  responseDivRef.current.scrollTop = responseDivRef.current.scrollHeight
                }
              }
            } catch (e) {
              console.error('Error parsing JSON:', e)
            }
          }
        }
      }
      
      // Once streaming is done, send to ElevenLabs for TTS
      if (accumulatedTextRef.current.trim() && isInitialized) {
        try {
          await connectToVoice(accumulatedTextRef.current)
        } catch (voiceErr) {
          console.error('Error connecting to voice:', voiceErr)
          setVoiceError('Failed to connect to voice service')
        }
        accumulatedTextRef.current = ''
      }
      
      if (fullResponse) {
        // Update conversation history with user question + AI response
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: questionBeingProcessed },
          { role: 'assistant', content: fullResponse }
        ])

        // Clear out the text states
        setTranscript("")
        setCurrentQuestion("")
      }
    } catch (error) {
      console.error('Error fetching AI response:', error)
      setVoiceError('Failed to fetch AI response')
    } finally {
      setIsProcessing(false)
      setIsSpeaking(false)
    }
  }

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      })
      setMediaStream(stream)

      // Connect to Deepgram with your desired settings
      await connectToDeepgram({
        model: "nova-3",
        interim_results: true,
        smart_format: true,
        language: "en-US",
        utterance_end_ms: 3000,
        filler_words: true,
      })
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      setMediaStream(null)
    }
    disconnectFromDeepgram()
  }

  // Effect for handling visibility changes
  useEffect(() => {
    if (isVisible && isStarted) {
      startRecording()
    } else {
      stopRecording()
    }
  }, [isVisible, isStarted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  // -----------------------------
  // RENDER
  // -----------------------------

  // Initial welcome screen
  if (!isStarted) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Mic className="h-12 w-12 mx-auto text-primary mb-3" />
            <p className="text-muted-foreground">
              I&apos;m here to help understand your coding problems.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center"
          >
            <Button 
              onClick={() => {
                setIsStarted(true)
                if (isVisible) {
                  startRecording()
                }
              }} 
              size="default"
              className="px-4 py-2"
            >
              Begin Conversation
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Main conversation interface
  return (
    <div className="p-4">
      {/* Tabs for question & conversation */}
      <Tabs defaultValue="question" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="question">Question</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
        </TabsList>

        {/* Current question tab */}
        <TabsContent value="question" className="mt-4">
          <ScrollArea className="h-[120px]">
            <div className="flex items-center justify-center h-full">
              {isProcessing || aiResponse ? (
                <div className="p-3 w-full">
                  <div className="flex items-start">
                    <Bot className="h-5 w-5 mr-2 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none">
                        {aiResponse || (
                          <div className="flex items-center">
                            <div className="animate-pulse flex space-x-1">
                              <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                              <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                              <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground">
                  {currentQuestion || "Listening for your question..."}
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Conversation history tab */}
        <TabsContent value="conversation" className="mt-4">
          <ScrollArea className="h-[300px]" ref={responseDivRef}>
            <div className="space-y-4">
              {/* Past conversation */}
              {conversationHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-muted' : 'border'}`}
                >
                  {message.role === 'user' ? (
                    <>
                      <strong className="text-primary">You: </strong>
                      {message.content}
                    </>
                  ) : (
                    <div className="flex items-start">
                      <Bot className="h-5 w-5 mr-2 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <strong className="text-primary">Assistant: </strong>
                        <div className="prose prose-sm mt-1">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* If question is active but no AI response yet */}
              {currentQuestion && !aiResponse && !isProcessing && (
                <div className="p-3 rounded-lg bg-muted">
                  <strong className="text-primary">You: </strong>
                  {currentQuestion}
                </div>
              )}
              
              {/* If question is active and AI is responding */}
              {currentQuestion && (aiResponse || isProcessing) && (
                <>
                  <div className="p-3 rounded-lg bg-muted">
                    <strong className="text-primary">You: </strong>
                    {currentQuestion}
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-start">
                      <Bot className="h-5 w-5 mr-2 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <strong className="text-primary">Assistant: </strong>
                        <div className="prose prose-sm mt-1">
                          {aiResponse || (
                            <div className="flex items-center">
                              <div className="animate-pulse flex space-x-1">
                                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Empty state (no conversation yet) */}
              {!currentQuestion && !aiResponse && !isProcessing && conversationHistory.length === 0 && (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Your conversation will appear here
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default QuestionPanel