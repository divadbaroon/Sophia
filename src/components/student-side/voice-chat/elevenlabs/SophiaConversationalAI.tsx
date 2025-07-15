'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X } from 'lucide-react'
import { useConversation } from '@11labs/react'
import { cn } from '@/lib/utils'

interface SophiaConversationalAIProps {
  onClose: () => void
}

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    console.error("Microphone permission denied");
    return false;
  }
}

async function getSignedUrl(): Promise<string> {
  const response = await fetch("/api/elevenlabs/signed-url");
  if (!response.ok) {
    throw Error("Failed to get signed url");
  }
  const data = await response.json();
  return data.signedUrl;
}

const SophiaConversationalAI: React.FC<SophiaConversationalAIProps> = ({ onClose }) => {
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>>([])
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const conversation = useConversation({
    onConnect: () => {
      console.log("Sophia connected");
      setError(null)
      setIsInitializing(false)
    },
    onDisconnect: () => {
      console.log("Sophia disconnected");
    },
    onError: (errorMessage: string, context?: any) => {
      console.error("Sophia conversation error:", errorMessage, context);
      setError(errorMessage || "Connection failed. Please try again.");
      setIsInitializing(false)
    },
    onMessage: (props: any) => {
      console.log("Sophia message:", props);
      
      // The useConversation hook provides simplified message props
      // with just the message text and source (user/assistant)
      const messageEntry = {
        role: props.source,
        content: props.message,
        timestamp: Date.now()
      }
      
      setConversationHistory(prev => [...prev, messageEntry])
    },
  });

  // Auto-start conversation when component mounts
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsInitializing(true)
        setError(null)
        
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          setError("Microphone permission is required to chat with Sophia");
          setIsInitializing(false)
          return;
        }
        
        const signedUrl = await getSignedUrl();
        const conversationId = await conversation.startSession({ signedUrl });
        console.log("Sophia conversation started:", conversationId);
      } catch (err) {
        console.error("Failed to start Sophia conversation:", err);
        setError("Failed to start conversation. Please try again.");
        setIsInitializing(false)
      }
    };

    initializeConversation();

    // Cleanup on unmount
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession().catch(console.error);
      }
    };
  }, []);

  const handleClose = useCallback(async () => {
    if (conversation.status === 'connected') {
      await conversation.endSession();
    }
    onClose();
  }, [conversation, onClose]);

  const handleReconnect = useCallback(async () => {
    try {
      setIsInitializing(true)
      setError(null)
      
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setError("Microphone permission is required to chat with Sophia");
        setIsInitializing(false)
        return;
      }
      
      const signedUrl = await getSignedUrl();
      await conversation.startSession({ signedUrl });
    } catch (err) {
      console.error("Failed to reconnect:", err);
      setError("Failed to reconnect. Please try again.");
      setIsInitializing(false)
    }
  }, [conversation]);

  // Get current state for display
  const getCurrentState = () => {
    if (error) return 'error'
    if (isInitializing) return 'initializing'
    if (conversation.status === 'connected') {
      return conversation.isSpeaking ? 'speaking' : 'listening'
    }
    return 'disconnected'
  }

  const currentState = getCurrentState()

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Sophia</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-red-500 mb-4">{error}</div>
        <div className="space-y-2">
          <Button onClick={handleReconnect} variant="outline">Try Again</Button>
          <Button onClick={handleClose}>Close</Button>
        </div>
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
              {/* Status indicator - matching original SophiaWrapper style */}
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2">
                  {currentState === 'listening' ? (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Listening</span>
                    </>
                  ) : currentState === 'speaking' ? (
                    <>
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Speaking</span>
                    </>
                  ) : currentState === 'initializing' ? (
                    <>
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Connecting</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-gray-500 rounded-full" />
                      <span className="text-xs text-muted-foreground">Ready</span>
                    </>
                  )}
                </div>
              </div>

              {/* Custom styled orb with wave animations */}
              <div className="flex justify-center items-center mb-6">
                <div
                  className={cn(
                    "orb",
                    conversation.status === "connected" && currentState === 'speaking'
                      ? "orb-active animate-orb"
                      : conversation.status === "connected"
                      ? "orb-inactive animate-orb-slow"
                      : "orb-inactive"
                  )}
                ></div>
              </div>
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
                        <span className="text-xs text-gray-500 mt-1 mr-1">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
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

export default SophiaConversationalAI