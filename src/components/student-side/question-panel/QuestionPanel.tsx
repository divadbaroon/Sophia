import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic, Bot } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConversationManagerContext } from '@/lib/context/ConversationManagerContext'

// Bouncing Dots Animation Component
const BouncingDots = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-3 h-3 bg-primary rounded-full animate-[bounce_1s_infinite_0ms]" />
    <div className="w-3 h-3 bg-primary rounded-full animate-[bounce_1s_infinite_200ms]" />
    <div className="w-3 h-3 bg-primary rounded-full animate-[bounce_1s_infinite_400ms]" />
  </div>
)

interface QuestionPanelProps {
  onBack: () => void
  isVisible?: boolean
}

const QuestionPanel: React.FC<QuestionPanelProps> = () => {
  const {
    isRecording,
    isSpeaking,
    isProcessing,
    transcript,
    conversationHistory,
    error,
    autoTTS,
    startRecording,
    stopRecording,
    clearError,
    toggleAutoTTS,
    speakLastResponse,
    stopSpeaking
  } = useConversationManagerContext()

  const [isStarted, setIsStarted] = useState(false)
  const [contentHeight, setContentHeight] = useState<number>(120)
  const contentRef = useRef<HTMLDivElement>(null)

  // Filter out system messages to only show user and assistant messages
  const displayMessages = conversationHistory.filter(
    message => message.role === 'user' || message.role === 'assistant'
  )

  // Find the most recent assistant message
  const getLastAssistantMessage = () => {
    if (displayMessages.length === 0) return null
    
    // Loop from the end to find the most recent assistant message
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      if (displayMessages[i].role === 'assistant') {
        return displayMessages[i]
      }
    }
    return null
  }
  
  const lastAssistantMessage = getLastAssistantMessage()

  // Update the height when content changes
  useEffect(() => {
    if (contentRef.current) {
      // Add a small delay to ensure content has rendered properly
      setTimeout(() => {
        const newHeight = contentRef.current?.scrollHeight || 120
        // Set a minimum height of 120px, and increase max to 400px
        setContentHeight(Math.max(120, Math.min(newHeight + 24, 400)))
      }, 0)
    }
  }, [lastAssistantMessage, transcript, isSpeaking])

  // Start recording when session begins
  useEffect(() => {
    if (isStarted && !isRecording) {
      startRecording()
    }
  }, [isStarted, isRecording, startRecording])

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => {
          clearError()
          setIsStarted(false)
        }}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="p-6 text-center">
        <Mic className="h-12 w-12 mx-auto text-primary mb-3" />
        <p className="text-muted-foreground mb-4">
          I&apos;m here to help understand your coding problems.
        </p>
        <Button 
          onClick={() => setIsStarted(true)} 
          size="default"
        >
          Begin Conversation
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="question" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="question">Current</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
        </TabsList>

        <TabsContent value="question" className="mt-4">
          <div 
            className="rounded-md border p-4"
            style={{ 
              height: `${contentHeight + 20}px`,
              overflow: 'auto' 
            }}
          >
            <div ref={contentRef}>
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-4 mt-7">
                  <BouncingDots />
                </div>
              ) : lastAssistantMessage ? (
                <div className="flex items-start p-2">
                  <Bot className="h-5 w-5 mr-2 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="prose prose-sm mt-1">
                      {lastAssistantMessage.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24">
                  <div className="text-lg text-muted-foreground">
                    <span>listening..</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conversation" className="mt-4">
          <ScrollArea className="rounded-md border h-96">
            <div className="space-y-4 p-4">
              {displayMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' ? 'bg-muted' : 'border'
                  }`}
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
              
              {!transcript && displayMessages.length === 0 && (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
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