'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Mic, MicOff } from 'lucide-react'

import VoiceCircle from '../question-panel/VoiceCircle'
import { useSophiaBrain } from './hooks/useSophiaBrain'
import { useSophiaConversation } from './useSophiaConversation'
import { SophiaWrapperProps } from './types/SophiaBrainType'

/**
 * SophiaWrapper using your existing ConversationManager
 */
const SophiaWrapper: React.FC<SophiaWrapperProps> = ({ onClose }) => {
  const sophia = useSophiaBrain()
  
  // Initialize conversation manager integration
  const { startRecording, isRecording, isInitialized } = useSophiaConversation()

  if (sophia.error) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Sophia</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-red-500 mb-4">{sophia.error}</div>
        <Button onClick={startRecording}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Sophia</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">Current</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <div className="rounded-md border p-4 min-h-[200px]">
            <div className="space-y-4">
              {/* State indicator */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {sophia.state === 'listening' && (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">Listening</span>
                      {isRecording && <Mic className="h-4 w-4 text-green-500" />}
                    </>
                  )}
                  {sophia.state === 'thinking' && (
                    <>
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">Thinking</span>
                    </>
                  )}
                  {sophia.state === 'speaking' && (
                    <>
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">Speaking</span>
                    </>
                  )}
                  {sophia.state === 'initializing' && (
                    <>
                      <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">Initializing</span>
                    </>
                  )}
                </div>
                
                {/* Voice status */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isInitialized ? (
                    <>
                      <Mic className="h-3 w-3" />
                      <span>Voice Ready</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="h-3 w-3" />
                      <span>Voice Disabled</span>
                    </>
                  )}
                </div>
              </div>

              {/* Voice Circle Animation */}
              <div className="flex justify-center items-center mb-6">
                <div className="h-28 w-28">
                  <VoiceCircle state={sophia.state === 'thinking' ? 'processing' : sophia.state} />
                </div>
              </div>

              {/* Current Text Display */}
              {sophia.currentText && (
                <div className="mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg min-h-[50px] flex items-center">
                    <p className="text-sm text-muted-foreground">
                      {sophia.state === 'listening' && '🎤 '}
                      {sophia.state === 'thinking' && '🤔 '}
                      {sophia.state === 'speaking' && '🗣️ '}
                      <span className="text-foreground">{sophia.currentText}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Start Listening Button */}
              {sophia.state !== 'listening' && sophia.state !== 'thinking' && sophia.state !== 'speaking' && (
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={startRecording}
                    disabled={!isInitialized}
                    className="px-6 py-2"
                  >
                    {isInitialized ? (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Listening
                      </>
                    ) : (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Voice Unavailable
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="rounded-md border p-4 min-h-[200px] max-h-96 overflow-auto">
            <div className="space-y-4">
              {sophia.conversationHistory && sophia.conversationHistory.length > 0 ? (
                sophia.conversationHistory.map((message, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      message.role === 'user' ? 'bg-muted' : 'bg-primary/10'
                    }`}
                  >
                    <strong className={message.role === 'user' ? 'text-primary' : 'text-foreground'}>
                      {message.role === 'user' ? '👤 You: ' : '🤖 Sophia: '}
                    </strong>
                    <span className="text-sm">{message.content}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Conversation history will appear here
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SophiaWrapper