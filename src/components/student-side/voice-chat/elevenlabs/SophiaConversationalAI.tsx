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

interface ConversationMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

async function requestMicrophonePermission() {
  console.log("🎤 Requesting microphone permission...")
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("✅ Microphone permission granted")
    return true;
  } catch (error) {
    console.error("❌ Microphone permission denied:", error);
    return false;
  }
}

async function getSignedUrl(): Promise<string> {
  console.log("🔗 Fetching signed URL...")
  try {
    const response = await fetch("/api/elevenlabs/signed-url");
    if (!response.ok) {
      throw Error(`HTTP ${response.status}: Failed to get signed url`);
    }
    const data = await response.json();
    console.log("✅ Signed URL obtained:", data.signedUrl ? "URL received" : "No URL");
    return data.signedUrl;
  } catch (error) {
    console.error("❌ Failed to get signed URL:", error);
    throw error;
  }
}

const SophiaConversationalAI: React.FC<SophiaConversationalAIProps> = ({ onClose }) => {
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])

  console.log("🔄 SophiaConversationalAI component rendered")

  const conversation = useConversation({
    onConnect: () => {
      console.log("🔗 Sophia connected successfully");
      setError(null)
      setIsInitializing(false)
    },
    onDisconnect: () => {
      console.log("🔌 Sophia disconnected");
    },
    onError: (errorMessage: string, context?: any) => {
      console.error("❌ Sophia conversation error:", errorMessage, context);
      setError(errorMessage || "Connection failed. Please try again.");
      setIsInitializing(false)
    },
    onMessage: (props: any) => {
      console.log("📨 Sophia message received:", props);
      
      // Add message to history
      const newMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: props.source === 'user' ? 'user' : 'assistant',
        content: props.message || props.text || 'Message received',
        timestamp: new Date()
      }
      
      setConversationHistory(prev => [...prev, newMessage])
    },
    onModeChange: (mode: any) => {
      console.log("🔄 Mode changed:", mode);
    },
    onStatusChange: (status: any) => {
      console.log("📊 Status changed:", status);
    }
  });

  // Auto-start conversation when component mounts
  useEffect(() => {
    console.log("🚀 Starting conversation initialization...")
    
    const initializeConversation = async () => {
      try {
        console.log("🔄 Setting initialization state...")
        setIsInitializing(true)
        setError(null)
        
        console.log("🎤 Checking microphone permissions...")
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          console.log("❌ Microphone permission required, stopping initialization")
          setError("Microphone permission is required to chat with Sophia");
          setIsInitializing(false)
          return;
        }
        
        console.log("🔗 Getting signed URL...")
        const signedUrl = await getSignedUrl();
        
        console.log("🎯 Starting ElevenLabs session...")
        const conversationId = await conversation.startSession({ signedUrl });
        console.log("✅ Sophia conversation started with ID:", conversationId);
        
      } catch (err) {
        console.error("❌ Failed to start Sophia conversation:", err);
        setError("Failed to start conversation. Please try again.");
        setIsInitializing(false)
      }
    };

    initializeConversation();

    // Cleanup on unmount
    return () => {
      console.log("🧹 Component unmounting, cleaning up conversation...")
      if (conversation.status === 'connected') {
        conversation.endSession().catch(console.error);
      }
    };
  }, []);

  const handleClose = useCallback(async () => {
    console.log("🚪 Closing Sophia conversation...")
    if (conversation.status === 'connected') {
      await conversation.endSession();
      console.log("✅ Conversation ended")
    }
    onClose();
  }, [conversation, onClose]);

  const handleReconnect = useCallback(async () => {
    console.log("🔄 Attempting to reconnect...")
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
      console.log("✅ Reconnection successful")
    } catch (err) {
      console.error("❌ Failed to reconnect:", err);
      setError("Failed to reconnect. Please try again.");
      setIsInitializing(false)
    }
  }, [conversation]);

  // Get current state for display
  const getCurrentState = () => {
    const state = (() => {
      if (error) return 'error'
      if (isInitializing) return 'initializing'
      if (conversation.status === 'connected') {
        return conversation.isSpeaking ? 'speaking' : 'listening'
      }
      return 'disconnected'
    })();
    
    console.log("📊 Current state:", state, "| Conversation status:", conversation.status, "| Is speaking:", conversation.isSpeaking);
    return state;
  }

  const currentState = getCurrentState()

  // Error state
  if (error) {
    console.log("❌ Rendering error state:", error)
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

  console.log("✅ Rendering main UI - Current state:", currentState)

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
            {conversationHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm mb-1">No conversation history yet</p>
                  <p className="text-xs">Start talking to see your conversation here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {conversationHistory.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "p-3 rounded-lg max-w-[85%]",
                        message.type === 'user'
                          ? "bg-blue-100 ml-auto text-blue-900"
                          : "bg-gray-100 mr-auto text-gray-900"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="text-xs font-medium mb-1">
                            {message.type === 'user' ? 'You' : 'Sophia'}
                          </div>
                          <div className="text-sm">{message.content}</div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
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