"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic, Bot, ChevronDown, ChevronUp, Code, RotateCw, ThumbsUp } from 'lucide-react'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'

interface QuestionPanelProps {
  onBack: () => void;
  isVisible?: boolean;
}

interface MessageWithHighlight {
  role: 'user' | 'assistant';
  content: string;
  highlightedCode?: string;
}

// Define the teaching stages
type TeachingStage = 
  | 'problem-understanding'  // First 2 questions - understanding the problem
  | 'conceptual-understanding' // Next 2 questions - conceptual knowledge

const QuestionPanel: React.FC<QuestionPanelProps> = ({ onBack, isVisible = true }) => {
  // State for managing the conversation flow
  const [isStarted, setIsStarted] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<MessageWithHighlight[]>([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [currentHighlightedCode, setCurrentHighlightedCode] = useState<string>("")
  
  // Track the teaching progression
  const [questionCount, setQuestionCount] = useState(0)
  const [currentStage, setCurrentStage] = useState<TeachingStage>('problem-understanding')
  const [readyForTA, setReadyForTA] = useState(false)
  const [hasSummarized, setHasSummarized] = useState(false)
  
  // Dynamic height states for content areas
  const [questionPanelHeight, setQuestionPanelHeight] = useState(120)
  const [conversationPanelHeight, setConversationPanelHeight] = useState(300)

  // Audio recording states and refs
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const responseDivRef = useRef<HTMLDivElement>(null)
  const questionContentRef = useRef<HTMLDivElement>(null)
  const conversationContentRef = useRef<HTMLDivElement>(null)

  // ElevenLabs integration
  const { connectToVoice, disconnect, isConnected, error, isInitialized } = useElevenLabs();
  const [isSpeaking, setIsSpeaking] = useState(false);
  // This ref will accumulate all the text before sending it to ElevenLabs
  const accumulatedTextRef = useRef<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Get complete file context for code understanding
  const { 
    fileContent, 
    errorContent, 
    selectedFile,
    highlightedText,
    executionOutput,
    testCases
  } = useFile()

  // Track highlighted text changes
  useEffect(() => {
    if (highlightedText && highlightedText.trim() !== '') {
      setCurrentHighlightedCode(highlightedText);
    }
  }, [highlightedText]);

  // Update teaching stage based on question count
  useEffect(() => {
    if (questionCount < 2) {
      setCurrentStage('problem-understanding');
    } else if (questionCount < 4) {
      setCurrentStage('conceptual-understanding');
    }
    
    // If already summarized, we stay at the current stage
    
    console.log(`Teaching stage updated: ${currentStage} (question ${questionCount})`);
  }, [questionCount, hasSummarized]);

  // Get the appropriate API endpoint based on current stage
  const getApiEndpoint = (): string => {
    switch (currentStage) {
      case 'problem-understanding':
        return '/api/chat';
      case 'conceptual-understanding':
        return '/api/conceptualUnderstanding';
      default:
        return '/api/chat'; // Fallback to default
    }
  };

  // Debug logging for teaching progression
  useEffect(() => {
    console.log('Teaching progression:', {
      questionCount,
      currentStage,
      endpoint: getApiEndpoint(),
      hasSummarized
    });
  }, [questionCount, currentStage, hasSummarized]);

  // Update panel heights based on content
  useEffect(() => {
    const calculateQuestionHeight = () => {
      if (questionContentRef.current) {
        const contentHeight = questionContentRef.current.scrollHeight;
        // Set a minimum height of 120px and max of 400px
        const newHeight = Math.max(120, Math.min(400, contentHeight + 40));
        setQuestionPanelHeight(newHeight);
      }
    };

    const calculateConversationHeight = () => {
      if (conversationContentRef.current) {
        const contentHeight = conversationContentRef.current.scrollHeight;
        // Set a minimum height of 300px and max based on viewport
        const viewportHeight = window.innerHeight;
        const maxHeight = viewportHeight * 0.7; // 70% of viewport
        const newHeight = Math.max(300, Math.min(maxHeight, contentHeight + 60));
        setConversationPanelHeight(newHeight);
      }
    };

    calculateQuestionHeight();
    calculateConversationHeight();

    // Add resize observer for dynamic updates
    const questionResizeObserver = new ResizeObserver(calculateQuestionHeight);
    const conversationResizeObserver = new ResizeObserver(calculateConversationHeight);
    
    if (questionContentRef.current) {
      questionResizeObserver.observe(questionContentRef.current);
    }
    
    if (conversationContentRef.current) {
      conversationResizeObserver.observe(conversationContentRef.current);
    }

    return () => {
      questionResizeObserver.disconnect();
      conversationResizeObserver.disconnect();
    };
  }, [aiResponse, currentQuestion, conversationHistory]);

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
  
  // Deepgram connection for speech-to-text
  const { 
    connection, 
    connectToDeepgram, 
    connectionState, 
    disconnectFromDeepgram 
  } = useDeepgram()
  
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
          // Handle new question
          if (!currentQuestion) {
            setCurrentQuestion(transcriptText.trim())
            setTranscript(transcriptText.trim())
            fetchAiResponse(transcriptText.trim())
          } else {
            // Handle additions to existing question
            const newTranscript = `${transcript} ${transcriptText}`.trim()
            setTranscript(newTranscript)
            setCurrentQuestion(newTranscript)
            
            // Only fetch new response if significant change
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

  // Generate conversation summary
  const generateSummary = async () => {
    if (isProcessing || hasSummarized) return;
    
    try {
      setIsProcessing(true);
      setAiResponse("");
      accumulatedTextRef.current = '';
      setVoiceError(null);
      
      const contextData = {
        transcript: "Could you summarize what we've discussed and check if I'm ready to talk to my TA?",
        fileContext: {
          fileName: selectedFile,
          content: fileContent,
          errorMessage: errorContent,
          executionOutput: executionOutput,
          testCases: testCases,
          highlightedText: highlightedText
        },
        conversationHistory: conversationHistory
      };

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Process response stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response stream");
      }
  
      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = "";
      
      setIsSpeaking(true);
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            const match = line.match(/^data: (.+)$/m);
            if (!match) continue;
            
            const data = match[1];
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
                setAiResponse(fullResponse);
                accumulatedTextRef.current += parsed.text;
                
                if (responseDivRef.current) {
                  responseDivRef.current.scrollTop = responseDivRef.current.scrollHeight;
                }
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }
      
      // Handle TTS
      if (accumulatedTextRef.current.trim() && isInitialized) {
        try {
          await connectToVoice(accumulatedTextRef.current);
        } catch (voiceErr) {
          console.error('Error connecting to voice:', voiceErr);
          setVoiceError('Failed to connect to voice service');
        }
        accumulatedTextRef.current = '';
      }
      
      if (fullResponse) {
        // Add system-generated summary to conversation
        setConversationHistory(prev => [
          ...prev,
          { 
            role: 'user', 
            content: "Could you summarize what we've discussed and check if I'm ready to talk to my TA?"
          },
          { 
            role: 'assistant', 
            content: fullResponse 
          }
        ]);
        
        // Mark summary as complete
        setHasSummarized(true);
        setCurrentQuestion("");
        setTranscript("");
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setVoiceError('Failed to generate summary');
    } finally {
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  // Fetch AI response with complete context
  const fetchAiResponse = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    // Handle "ready for TA" responses
    if (
      hasSummarized && 
      (text.toLowerCase().includes("yes") || 
       text.toLowerCase().includes("ready") || 
       text.toLowerCase().includes("ta"))
    ) {
      setReadyForTA(true);
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { 
          role: 'assistant', 
          content: "Great! I'll let your TA know you're ready to chat. They'll be with you shortly. Good luck with your assignment!" 
        }
      ]);
      return;
    }
    
    try {
      setIsProcessing(true);
      setAiResponse("");
      accumulatedTextRef.current = '';
      setVoiceError(null);
      
      const questionBeingProcessed = text;
      const apiEndpoint = getApiEndpoint();
      
      // Prepare request based on current stage
      const contextData =  {
            transcript: text,
            fileContext: {
              fileName: selectedFile,
              content: fileContent,
              errorMessage: errorContent,
              executionOutput: executionOutput,
              testCases: testCases,
              highlightedText: highlightedText
            }
          };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response stream");
      }
  
      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = "";
      
      setIsSpeaking(true);
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            const match = line.match(/^data: (.+)$/m);
            if (!match) continue;
            
            const data = match[1];
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
                setAiResponse(fullResponse);
                accumulatedTextRef.current += parsed.text;
                
                if (responseDivRef.current) {
                  responseDivRef.current.scrollTop = responseDivRef.current.scrollHeight;
                }
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }
      
      // Handle TTS
      if (accumulatedTextRef.current.trim() && isInitialized) {
        try {
          await connectToVoice(accumulatedTextRef.current);
        } catch (voiceErr) {
          console.error('Error connecting to voice:', voiceErr);
          setVoiceError('Failed to connect to voice service');
        }
        accumulatedTextRef.current = '';
      }
      
      if (fullResponse) {
        // Capture highlighted code
        const userHighlightedCode = currentHighlightedCode;
        
        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { 
            role: 'user', 
            content: questionBeingProcessed,
            highlightedCode: userHighlightedCode && userHighlightedCode.trim() !== '' ? userHighlightedCode : undefined
          },
          { 
            role: 'assistant', 
            content: fullResponse 
          }
        ]);
      
        
        // Reset current state
        setTranscript("");
        setCurrentQuestion("");
        setCurrentHighlightedCode("");
      }
      
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setVoiceError('Failed to fetch AI response');
    } finally {
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  // Initialize audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      })
      setMediaStream(stream)

      // Connect to Deepgram with optimal settings
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

  // Clean up recording resources
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    mediaStream?.getTracks().forEach((track) => track.stop())
    setMediaStream(null)
    disconnectFromDeepgram()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  // Message component with collapsible highlighted code
  const MessageWithHighlightedCode = ({ message }: { message: MessageWithHighlight }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Only render as collapsible if there's highlighted code
    if (!message.highlightedCode) {
      return (
        <div className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-muted' : 'border'}`}>
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
      );
    }
    
    return (
      <div className={`rounded-lg ${message.role === 'user' ? 'bg-muted' : 'border'}`}>
        <div className="p-3">
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
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <div className="flex justify-between items-center px-3 py-1 border-t border-muted">
            <div className="flex items-center text-xs text-muted-foreground">
              <Code className="h-3 w-3 mr-1" />
              <span>Highlighted code</span>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="p-3 pt-1 bg-slate-100 rounded-b-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {message.highlightedCode}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Render stage indicator
  const renderStageIndicator = () => {
    if (!isStarted) return null;
    
    let badgeText = "";
    let badgeVariant: "default" | "secondary" | "outline" | "destructive" = "default";
    
    switch (currentStage) {
      case 'problem-understanding':
        badgeText = "Stage 1: Problem Understanding";
        badgeVariant = "secondary";
        break;
      case 'conceptual-understanding':
        badgeText = "Stage 2: Conceptual Knowledge";
        badgeVariant = "secondary";
        break;
    }
    
    if (readyForTA) {
      badgeText = "Ready for TA";
      badgeVariant = "default";
    }
    
    return (
      <Badge variant={badgeVariant} className="mb-2">
        {badgeText}
      </Badge>
    );
  };

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
                startRecording()
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
      {/* Header with recording status and stage indicator */}
      <div className="flex justify-between items-center mb-2">
        
        {readyForTA && (
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs text-green-600">TA notified</span>
          </div>
        )}
      </div>
      
      {/* Tabs for current question and conversation history */}
      <Tabs defaultValue="question" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="question">Question</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
        </TabsList>

        {/* Current question tab - Dynamic height */}
        <TabsContent value="question" className="mt-4">
          <ScrollArea className={`h-[${questionPanelHeight}px]`} style={{ height: questionPanelHeight }}>
            <div ref={questionContentRef} className="flex items-center justify-center h-full">
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
                <div>
                  <p className="text-lg text-muted-foreground">
                    {currentQuestion || "Listening for your question..."}
                  </p>
                  {currentHighlightedCode && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center">
                      <Code className="h-3 w-3 mr-1" />
                      <span>Highlighted code will be attached to your message</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Conversation history tab - Dynamic height */}
        <TabsContent value="conversation" className="mt-4">
          <ScrollArea 
            className={`h-[${conversationPanelHeight}px]`}
            style={{ height: conversationPanelHeight }} 
            ref={responseDivRef}
          >
            <div ref={conversationContentRef} className="space-y-4">
              {/* Display past conversation with collapsible highlighted code */}
              {conversationHistory.map((message, index) => (
                <MessageWithHighlightedCode key={index} message={message} />
              ))}
              
              {/* Current question display */}
              {currentQuestion && !aiResponse && !isProcessing && (
                <div className="p-3 rounded-lg bg-muted">
                  <strong className="text-primary">You: </strong>
                  {currentQuestion}
                  {currentHighlightedCode && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center">
                      <Code className="h-3 w-3 mr-1" />
                      <span>With highlighted code</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Active response display */}
              {currentQuestion && (aiResponse || isProcessing) && (
                <>
                  <div className="p-3 rounded-lg bg-muted">
                    <strong className="text-primary">You: </strong>
                    {currentQuestion}
                    {currentHighlightedCode && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center">
                        <Code className="h-3 w-3 mr-1" />
                        <span>With highlighted code</span>
                      </div>
                    )}
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
              
              {/* Empty state */}
              {!currentQuestion && !aiResponse && !isProcessing && conversationHistory.length === 0 && (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Your conversation will appear here
                </div>
              )}
              
              {/* Summary actions - only show when at summary stage */}
              {hasSummarized && !readyForTA && (
                <div className="flex justify-center mt-4 space-x-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Continue with implementation help
                      setCurrentQuestion("");
                      setTranscript("");
                    }}
                    className="flex items-center"
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    Continue practicing
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={() => {
                      // Signal readiness for TA
                      setReadyForTA(true);
                      setConversationHistory(prev => [
                        ...prev,
                        { 
                          role: 'user', 
                          content: "Yes, I'm ready to talk to my TA now."
                        },
                        { 
                          role: 'assistant', 
                          content: "Great! I'll let your TA know you're ready to chat. They'll be with you shortly. Good luck with your assignment!" 
                        }
                      ]);
                    }}
                    className="flex items-center"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Ready for TA
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Voice error indicator */}
      {voiceError && (
        <div className="mt-2 text-xs text-red-500 flex items-center justify-center">
          <span>{voiceError}</span>
        </div>
      )}
    </div>
  )
}

export default QuestionPanel