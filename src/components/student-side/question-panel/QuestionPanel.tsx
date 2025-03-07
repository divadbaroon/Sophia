import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic, Bot, Settings, Users, ArrowRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConversationManagerContext } from '@/lib/context/ConversationManagerContext'
import { useFile } from '@/lib/context/FileContext'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

// Bouncing Dots Animation Component
const BouncingDots = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-3 h-3 bg-primary rounded-full animate-[bounce_1s_infinite_0ms]" />
    <div className="w-3 h-3 bg-primary rounded-full animate-[bounce_1s_infinite_200ms]" />
    <div className="w-3 h-3 bg-primary rounded-full animate-[bounce_1s_infinite_400ms]" />
  </div>
)

// Improved formatting function for group conversations
const formatGroupConversation = (content: string | null): React.ReactNode => {
  if (!content) return '';
  
  // Split conversation into individual turns
  // Using a simpler regex to avoid 's' flag which requires ES2018
  const parts = content.split(/\n?Teacher:|Alex:/);
  
  if (parts.length <= 1) return content;
  
  const formattedContent: React.ReactNode[] = [];
  let index = 0;
  
  // The first part is empty when content starts with a speaker label
  if (parts[0].trim() === '') {
    parts.shift();
  }

  // Process each part
  for (let i = 0; i < parts.length; i++) {
    // Skip empty parts
    if (!parts[i] || parts[i].trim() === '') continue;
    
    // Determine speaker based on context
    const isSpeakerTeacher = content.indexOf('Teacher:' + parts[i]) !== -1;
    
    if (isSpeakerTeacher) {
      formattedContent.push(
        <div key={`speaker-${index}`} className="font-bold text-blue-600 mt-4">Teacher:</div>,
        <div key={`content-${index}`} className="ml-4 mb-4">{parts[i].trim()}</div>
      );
    } else {
      formattedContent.push(
        <div key={`speaker-${index}`} className="font-bold text-green-600 mt-4">Alex:</div>,
        <div key={`content-${index}`} className="ml-4 mb-4">{parts[i].trim()}</div>
      );
    }
    
    index++;
  }
  
  // If no formatted content was generated, fallback to the original content
  if (formattedContent.length === 0) {
    return content;
  }
  
  return formattedContent;
};

// Helper function to prepare content for TTS by removing speaker labels
const prepareForTTS = (content: string | null): string => {
  if (!content) return '';
  
  // Remove speaker labels for TTS (using split and join to avoid 'g' flag)
  return content.split(/\n?Teacher:|Alex:/).join('\n').trim();
};

interface QuestionPanelProps {
  onBack: () => void
  isVisible?: boolean
  onLineDetected?: (lineNumber: number) => void
  onClearHighlight?: () => void
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ 
  onBack,
  isVisible,
  onLineDetected,
  onClearHighlight
}) => {
  const {
    isRecording,
    isSpeaking,
    isProcessing,
    transcript,
    conversationHistory,
    currentStreamingMessage,
    error,
    autoTTS,
    startRecording,
    stopRecording,
    clearError,
    toggleAutoTTS,
    speakLastResponse,
    stopSpeaking,
    onSentenceAdded,
    queryClaudeWithText
  } = useConversationManagerContext()
  
  // Get FileContext
  const { 
    speakTo: fileSpeakTo, 
    scenario: fileScenario, 
    updateSpeakTo, 
    updateScenario 
  } = useFile()

  const [isStarted, setIsStarted] = useState(false)
  const [contentHeight, setContentHeight] = useState<number>(120)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const userMessageCountRef = useRef<number>(0)
  
  // Local state for settings that will be updated to FileContext when saved
  const [localSpeakTo, setLocalSpeakTo] = useState<'student' | 'ta'>(fileSpeakTo)
  const [localScenario, setLocalScenario] = useState<'one-on-one' | 'group'>(fileScenario)
  
  // Find the most recent assistant message content
  const getLastAssistantContent = useCallback(() => {
    // If we have a streaming message in progress, use that content
    if (currentStreamingMessage && typeof currentStreamingMessage === 'object') {
      return currentStreamingMessage.content;
    }
    
    // Otherwise, find the last assistant message from history
    const displayMessages = conversationHistory.filter(
      message => message.role === 'user' || message.role === 'assistant'
    );
    
    if (displayMessages.length === 0) return null;
    
    // Loop from the end to find the most recent assistant message
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      if (displayMessages[i].role === 'assistant') {
        return displayMessages[i].content;
      }
    }
    return null;
  }, [currentStreamingMessage, conversationHistory]);
  
  const lastAssistantContent = getLastAssistantContent();

  // Handle beginning the conversation
  const handleBeginConversation = useCallback(() => {
    setIsStarted(true);
    
    // If it's a group scenario, automatically start a conversation
    if (fileScenario === 'group') {
      // Small delay to ensure everything is initialized
      setTimeout(() => {
        // Trigger an automatic first message to start the classroom discussion
        queryClaudeWithText("Start the classroom discussion about this code.");
      }, 500);
    }
  }, [fileScenario, queryClaudeWithText]);

  // Continue the group discussion
  const handleContinueDiscussion = useCallback(() => {
    queryClaudeWithText("Continue the classroom discussion with more detail.");
  }, [queryClaudeWithText]);

  // Custom TTS handler for group conversations
  const handleGroupTTS = useCallback(() => {
    const content = getLastAssistantContent();
    if (content) {
      // Remove speaker labels before TTS
      const ttsContent = prepareForTTS(content);
      
      // Use the regular TTS function with the modified content
      if (typeof speakLastResponse === 'function') {
        // If your TTS function accepts custom text:
        // speakLastResponse(ttsContent);
        
        // Otherwise, you might need to temporarily replace the content:
        speakLastResponse();
      }
    }
  }, [getLastAssistantContent, speakLastResponse]);

  // Update local state when FileContext changes
  useEffect(() => {
    setLocalSpeakTo(fileSpeakTo)
    setLocalScenario(fileScenario)
  }, [fileSpeakTo, fileScenario])

  // Reset highlights when user sends a new message
  useEffect(() => {
    const userMessages = conversationHistory.filter(msg => msg.role === 'user').length;
    
    if (userMessages > userMessageCountRef.current) {
      console.log("New user message detected, clearing any highlights");
      if (onClearHighlight) onClearHighlight();
    }
    
    userMessageCountRef.current = userMessages;
  }, [conversationHistory, onClearHighlight]);

  // Simple line detection that runs continuously
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    const checkForLineNumbers = () => {
      // Current message content - either streaming or most recent completed
      let content = "";
      
      if (currentStreamingMessage && typeof currentStreamingMessage === 'object') {
        content = currentStreamingMessage.content || "";
      } else if (conversationHistory.length > 0) {
        // Get the most recent assistant message
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          if (conversationHistory[i].role === 'assistant') {
            content = conversationHistory[i].content;
            break;
          }
        }
      }
      
      if (content) {
        const regex = /line\s+(\d+)/gi;
        let match;
        let lastLineNumber = null;
        
        // Find the last line number mentioned in the content
        while ((match = regex.exec(content)) !== null) {
          lastLineNumber = parseInt(match[1], 10);
        }
        
        // If we found a line number and have a callback, call it
        if (lastLineNumber !== null && onLineDetected) {
          onLineDetected(lastLineNumber);
          console.log("Highlighting line:", lastLineNumber);
        }
      }
    };
    
    // Start the interval check
    checkInterval = setInterval(checkForLineNumbers, 1000);
    
    // Initial check
    checkForLineNumbers();
    
    // Clean up
    return () => {
      clearInterval(checkInterval);
      if (onClearHighlight) onClearHighlight();
    };
  }, [currentStreamingMessage, conversationHistory, onLineDetected, onClearHighlight]);

  // Filter out system messages to only show user and assistant messages
  const displayMessages = conversationHistory.filter(
    message => message.role === 'user' || message.role === 'assistant'
  )

  // Subscribe to sentence added events
  useEffect(() => {
    // Only subscribe if onSentenceAdded is available
    if (typeof onSentenceAdded === 'function') {
      try {
        const unsubscribe = onSentenceAdded(({ messageId, sentence }) => {
          // Force a re-render when a new sentence is added by updating the height
          if (contentRef.current) {
            setTimeout(() => {
              const newHeight = contentRef.current?.scrollHeight || 120;
              setContentHeight(Math.max(120, Math.min(newHeight + 24, 400)));
            }, 0);
          }
        });
        
        return () => {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        };
      } catch (error) {
        console.warn('Failed to subscribe to sentence events:', error);
        // No need to rethrow - we'll just continue without the subscription
      }
    }
    
    // Return empty cleanup if we couldn't subscribe
    return () => {};
  }, [onSentenceAdded]);

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
  }, [lastAssistantContent, transcript, isSpeaking, currentStreamingMessage])

  // Start recording when session begins (only for one-on-one mode)
  useEffect(() => {
    if (isStarted && !isRecording && fileScenario !== 'group') {
      startRecording()
    }
  }, [isStarted, isRecording, startRecording, fileScenario])

  // Save settings to FileContext
  const saveSettings = () => {
    updateSpeakTo(localSpeakTo)
    updateScenario(localScenario)
    setIsSettingsOpen(false)
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => {
          clearError()
          setIsStarted(false)
          if (onClearHighlight) onClearHighlight(); // Clear highlights on error
        }}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-full"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        {fileScenario === 'group' ? (
          <Users className="h-12 w-12 mx-auto text-primary mb-3" />
        ) : (
          <Mic className="h-12 w-12 mx-auto text-primary mb-3" />
        )}
        <p className="text-muted-foreground mb-4">
          {fileScenario === 'group' 
            ? "Observe a discussion between a teacher and student about this code."
            : "I'm here to help understand your coding problems."}
        </p>
        <Button 
          onClick={handleBeginConversation} 
          size="default"
        >
          {fileScenario === 'group' ? 'Observe Discussion' : 'Begin Conversation'}
        </Button>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conversation Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Who would you like to speak to?</h3>
                  <RadioGroup 
                    value={localSpeakTo}
                    onValueChange={(value) => setLocalSpeakTo(value as 'student' | 'ta')}
                    className="flex flex-col space-y-2"
                  >
                     <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ta" id="ta" />
                      <Label htmlFor="ta">TA</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student">Student</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Scenario</h3>
                  <RadioGroup 
                    value={localScenario}
                    onValueChange={(value) => setLocalScenario(value as 'one-on-one' | 'group')}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-on-one" id="one-on-one" />
                      <Label htmlFor="one-on-one">1 on 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="group" id="group" />
                      <Label htmlFor="group">Group</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={saveSettings}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Fix the condition for showing processing
  const showProcessing = isProcessing && !lastAssistantContent;

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
              {/* Prioritize content display - fixed rendering logic */}
              {lastAssistantContent ? (
                <div className="flex items-start p-2">
                  <div className="flex-1">
                    <div className="prose prose-sm mt-1">
                      {fileScenario === 'group' 
                        ? formatGroupConversation(lastAssistantContent)
                        : lastAssistantContent
                      }
                      {currentStreamingMessage && 
                       typeof currentStreamingMessage === 'object' && 
                       !currentStreamingMessage.isComplete && (
                        <span className="inline-block animate-pulse">▋</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : showProcessing ? (
                <div className="flex flex-col items-center justify-center py-4 mt-7">
                  <BouncingDots />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24">
                  <div className="text-lg text-muted-foreground">
                    {fileScenario === 'group' 
                      ? "Starting discussion..." 
                      : "listening.."}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Add continue button for group discussions */}
          {fileScenario === 'group' && lastAssistantContent && (
            <div className="mt-4 flex justify-center gap-4">
              <Button 
                onClick={handleContinueDiscussion}
                disabled={isProcessing}
                className="flex items-center"
              >
                Continue Discussion <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleGroupTTS}
                disabled={isProcessing || isSpeaking}
                variant="outline"
              >
                {isSpeaking ? 'Listening...' : 'Listen'}
              </Button>
            </div>
          )}
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
                      <div className="flex-1">
                        {fileScenario === 'group' 
                          ? formatGroupConversation(message.content)
                          : (
                            <>
                              <strong className="text-primary">Assistant: </strong>
                              <div className="prose prose-sm mt-1">
                                {message.content}
                              </div>
                            </>
                          )
                        }
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show current streaming message if it exists */}
              {currentStreamingMessage && (
                <div className="p-3 rounded-lg border">
                  <div className="flex items-start">
                    <div className="flex-1">
                      {fileScenario === 'group' 
                        ? formatGroupConversation(currentStreamingMessage.content)
                        : (
                          <>
                            <strong className="text-primary">Assistant: </strong>
                            <div className="prose prose-sm mt-1">
                              {currentStreamingMessage.content}
                            </div>
                          </>
                        )
                      }
                      {!currentStreamingMessage.isComplete && (
                        <span className="inline-block animate-pulse">▋</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {!transcript && displayMessages.length === 0 && !currentStreamingMessage && (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Your conversation will appear here
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conversation Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Who would you like to speak to?</h3>
                <RadioGroup 
                  value={localSpeakTo}
                  onValueChange={(value) => setLocalSpeakTo(value as 'student' | 'ta')}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="speaking-student" />
                    <Label htmlFor="speaking-student">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ta" id="speaking-ta" />
                    <Label htmlFor="speaking-ta">TA</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">Scenario</h3>
                <RadioGroup 
                  value={localScenario}
                  onValueChange={(value) => setLocalScenario(value as 'one-on-one' | 'group')}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="one-on-one" id="scenario-one" />
                    <Label htmlFor="scenario-one">1 on 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="group" id="scenario-group" />
                    <Label htmlFor="scenario-group">Group</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveSettings}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default QuestionPanel