'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X } from 'lucide-react'
import VoiceCircle from './VoiceCircle'
import { useSophiaBrain } from './hooks/useSophiaBrain'

interface SophiaWrapperProps {
  onClose: () => void
}

const SophiaWrapper: React.FC<SophiaWrapperProps> = ({ onClose }) => {
  const brain = useSophiaBrain()
  
  const currentState = brain.state
  const transcript = brain.currentText
  const error = brain.error
  const conversationHistory = brain.conversationHistory

  if (error) {
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
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">Current</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <div className="rounded-md border p-4 min-h-[200px]">
            <div className="space-y-4">
              {/* Status indicator */}
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2">
                  {currentState === 'listening' ? (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Listening</span>
                    </>
                  ) : currentState === 'thinking' ? (
                    <>
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Processing</span>
                    </>
                  ) : currentState === 'speaking' ? (
                    <>
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Speaking</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-gray-500 rounded-full" />
                      <span className="text-xs text-muted-foreground">Ready</span>
                    </>
                  )}
                </div>
              </div>

              {/* Voice Circle Animation */}
              {currentState !== 'listening' && (
                <div className="flex justify-center items-center mb-6">
                  <div className="h-28 w-28">
                    <VoiceCircle state={currentState} />
                  </div>
                </div>
              )}

              {/* Transcript display */}
              {(transcript || currentState === 'listening') && (
                <div className="flex justify-center items-center min-h-[120px]">
                  <div className="text-center max-w-md">
                    {transcript ? (
                      <p className="text-lg leading-relaxed text-foreground">
                        {transcript}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Start speaking...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="rounded-md border p-4 min-h-[200px] max-h-96 overflow-auto">
            {conversationHistory.length > 0 ? (
              <div className="space-y-4">
                {conversationHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Message content */}
                      <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Chat bubble */}
                        <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                          message.role === 'user' 
                            ? 'bg-blue-500 text-white rounded-br-md' 
                            : 'bg-gray-100 text-gray-900 rounded-bl-md border'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          
                        </div>
                        {/* Timestamp */}
                          {message.timestamp && (
                            <span className="text-xs text-gray-500 mt-1 mr-1">
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm mb-1">No conversation yet</p>
                  <p className="text-xs">Start speaking to chat with Sophia</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SophiaWrapper