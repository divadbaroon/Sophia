import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ConversationManager, ConversationStatus } from '@/lib/services/ConversationManager';
import { ConversationManagerOptions, ConversationState, ClaudeMessage } from "@/types";
import { useFile } from '@/lib/context/FileContext';
import Anthropic from '@anthropic-ai/sdk';
import { ElevenLabsClient } from 'elevenlabs';
import { prepareClaudePrompt } from '@/utils/claude/claudePromptCreation';
import { ConceptMapService, ConceptMap } from '@/lib/services/ConceptMap';
import { createClient } from '@/utils/supabase/client';

import { updateStudentSessionData } from "@/lib/actions/studentsActions"

// Get environment variables
const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'iDxgwKogoeR1jrVkJKJv';

export const useConversationManager = () => {
  // Get file context
  const fileContext = useFile();
  
  // Get session and student IDs for storage
  const params = useParams();
  const sessionId = params?.id ? parseInt(params.id as string) : null;
  
  // Track user/student ID for storage
  const [studentId, setStudentId] = useState<string | null>(null);
  
  // Effect to get student ID from Supabase auth
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting authenticated user:', error);
          return;
        }
        
        if (user) {
          console.log('Got authenticated user:', user.id);
          setStudentId(user.id);
        } else {
          console.warn('No authenticated user found');
        }
      } catch (error) {
        console.error('Error in fetchUser:', error);
      }
    };
    
    fetchUser();
  }, []);
  
  // State to synchronize with the manager
  const [state, setState] = useState<ConversationState>({
    transcript: "",
    conversationHistory: [],
    currentStreamingMessage: null,
    error: null,
    autoTTS: true,
    status: ConversationStatus.IDLE
  });

  // Track initialization status
  const [isInitialized, setIsInitialized] = useState(false);
  
  // State for concept map
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [conceptMapReady, setConceptMapReady] = useState(false);
  const [taPivot, setTaPivot] = useState<string | null>(null);
  const [isConceptMapProcessing, setIsConceptMapProcessing] = useState(false);
  
  // Keep track of all pivot messages and concept maps for history
  const conceptMapHistoryRef = useRef<ConceptMap[]>([]);
  const pivotMessageHistoryRef = useRef<string[]>([]);

  // Track if confidence was previously met (to detect changes)
  const wasConfidenceMetRef = useRef<boolean>(false);

  const previousLogRef = useRef<{
    conceptMapString: string;
    ready: boolean;
    pivot: string | null;
  }>({
    conceptMapString: '',
    ready: false,
    pivot: null
  });
  
  // Save concept map and pivot when they change
  useEffect(() => {
    // Only update when there's a meaningful change
    const conceptMapString = JSON.stringify(conceptMap);
    
    if (
      conceptMapString !== previousLogRef.current.conceptMapString ||
      conceptMapReady !== previousLogRef.current.ready ||
      taPivot !== previousLogRef.current.pivot
    ) {
      // Log the changes (for debugging only)
      console.log("CONCEPT MAP", conceptMap);
      console.log("CONCEPT MAP Ready", conceptMapReady);
      console.log("CONCEPT MAP Pivot", taPivot);
      
      // Update the ref
      previousLogRef.current = {
        conceptMapString,
        ready: conceptMapReady,
        pivot: taPivot
      };

      console.log("🔵🔵🔵 UPDATING SESSION FOR USER:", studentId);
      
      // If we have sessionId and studentId, save the data directly
      if (studentId && conceptMap) {
        // Add to history if this is a new pivot message
        if (taPivot && !pivotMessageHistoryRef.current.includes(taPivot)) {
          pivotMessageHistoryRef.current.push(taPivot);
        }
        
        // Add to concept map history
        conceptMapHistoryRef.current.push({...conceptMap});
        
        // Prepare data for saving
        const dataToSave = {
          conceptMap,
          pivotMessage: taPivot,
          conceptMapConfidenceMet: conceptMapReady,
          pivotMessageHistory: pivotMessageHistoryRef.current,
          conceptMapHistory: conceptMapHistoryRef.current,
          lastUpdated: new Date().toISOString()
        };

        console.log("UPDATING SESSION WITH ", dataToSave)
        
        // Save directly to the database
        updateStudentSessionData(studentId, dataToSave)
    
        // If confidence was newly met, save additional data
        if (conceptMapReady && !wasConfidenceMetRef.current) {
          wasConfidenceMetRef.current = true;
          
          // Save code, task, and error content when confidence is met
          updateStudentSessionData(studentId, {
            code: fileContext?.fileContent || '',
            task: fileContext?.studentTask || '',
            errorContent: fileContext?.errorContent || '',
            confidenceMetAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          })
        }
      }
    }
  }, [conceptMap, conceptMapReady, taPivot, sessionId, studentId]);
  
  // Manager reference
  const managerRef = useRef<ConversationManager | null>(null);
  
  // Anthropic client reference
  const anthropicClientRef = useRef<Anthropic | null>(null);
  
  // ElevenLabs client reference
  const elevenLabsClientRef = useRef<ElevenLabsClient | null>(null);
  
  // Concept map service reference
  const conceptMapServiceRef = useRef<ConceptMapService | null>(null);
  
  // Buffer to hold sentences for TTS
  const ttsQueueRef = useRef<string[]>([]);
  
  // Flag to track if TTS is currently speaking
  const isSpeakingRef = useRef<boolean>(false);
  
  // Reference to active audio elements - for canceling playback
  const activeAudioElementsRef = useRef<HTMLAudioElement[]>([]);
  
  // Flag to prevent recursive calls
  const isHandlingBargeInRef = useRef<boolean>(false);

  // Initialize the manager
  useEffect(() => {
    // Skip if already initialized
    if (managerRef.current) {
      return;
    }

    try {
      const conversationOptions: ConversationManagerOptions = {
        silenceThreshold: 2000, // 2 seconds
        deepgramApiKey: DEEPGRAM_API_KEY,
        fileContext
      };
      
      // Create services
      const manager = new ConversationManager(conversationOptions);
      
      // Subscribe to state changes
      const unsubscribe = manager.subscribe((newState) => {
        setState(newState);
        
        // Add barge-in detection
        if (!isHandlingBargeInRef.current && 
            isSpeakingRef.current && 
            newState.transcript && 
            newState.transcript.trim() !== '') {
          console.log(`🔊 [${new Date().toISOString()}] Barge-in detected! User started speaking while system was speaking.`);
          // Cancel all audio playback
          cancelAllAudioPlayback();
        }
      });
      
      // Initialize the concept map service
      const conceptService = new ConceptMapService(
        ANTHROPIC_API_KEY, 
        () => {            
          setConceptMapReady(true);
          if (conceptMapServiceRef.current) {
            setTaPivot(conceptMapServiceRef.current.getTAPivot());
            setConceptMap(conceptMapServiceRef.current.getConceptMap());
          }
        }
      );
      
      // Initialize
      manager.initialize();
      
      // Set up event listeners for transcript events
      manager.on('transcriptFinalized', ({ text, timestamp }) => {
        console.log(`[EVENT] Transcript finalized at ${new Date(timestamp).toISOString()}:`, text);
        
        // Process the transcript with concept map immediately after user message is finalized
        if (conceptMapServiceRef.current && text.trim() !== '') {
          // Set processing flag to true
          setIsConceptMapProcessing(true);
          
          // Get the current conversation history
          const currentHistory = manager.getState().conversationHistory;
          
          console.log('🧩 Updating concept map with new user message');
          
          conceptMapServiceRef.current.processNewMessage(
            text,
            currentHistory,
            fileContext?.studentTask || '',
            fileContext?.fileContent || '',
            fileContext?.errorContent || '',
            fileContext 
          ).then(() => {
            if (conceptMapServiceRef.current) {
              // Update concept map and related state
              setConceptMap(conceptMapServiceRef.current.getConceptMap());
              const newConfidenceState = conceptMapServiceRef.current.hasReachedConfidence();
              setConceptMapReady(newConfidenceState);
              
              // Update pivot
              const newPivot = conceptMapServiceRef.current.getTAPivot();
              setTaPivot(newPivot);
              
              // Update fileContext with the latest pivot and confidence state
              if (fileContext) {
                fileContext.updateConceptMapConfidence?.(newConfidenceState);
                fileContext.updateLatestPivotMessage?.(newPivot);
              }
            }
            // Set processing flag to false when done
            setIsConceptMapProcessing(false);
          });
        }
      });
      
      // Store references
      managerRef.current = manager;
      conceptMapServiceRef.current = conceptService;
      setIsInitialized(true);
      
      // Initialize Anthropic client
      if (ANTHROPIC_API_KEY) {
        anthropicClientRef.current = new Anthropic({
          apiKey: ANTHROPIC_API_KEY,
          dangerouslyAllowBrowser: true 
        });
      }
      
      // Initialize ElevenLabs client
      if (ELEVENLABS_API_KEY) {
        elevenLabsClientRef.current = new ElevenLabsClient({
          apiKey: ELEVENLABS_API_KEY
        });
      }
      
      // Cleanup
      return () => {
        unsubscribe();
        if (managerRef.current) {
          managerRef.current.dispose();
          managerRef.current = null;
          setIsInitialized(false);
        }
        // Cancel any playing audio
        cancelAllAudioPlayback();
        // Clean up concept map service
        conceptMapServiceRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize conversation manager:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize speech recognition system' }));
    }
  }, []);
  
  // Function to cancel all audio playback
  const cancelAllAudioPlayback = useCallback(() => {
    // Prevent recursive calls
    if (isHandlingBargeInRef.current) {
      return;
    }
    
    isHandlingBargeInRef.current = true;
    console.log(`🔊 [${new Date().toISOString()}] Canceling all audio playback`);
    
    // Stop all active audio elements
    activeAudioElementsRef.current.forEach(audio => {
      try {
        audio.pause();
        // Clean up the audio element
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    });
    
    // Clear the active audio elements array
    activeAudioElementsRef.current = [];
    
    // Clear the TTS queue
    ttsQueueRef.current = [];
    
    // If system was speaking, return to IDLE state
    if (isSpeakingRef.current && managerRef.current) {
      isSpeakingRef.current = false;
      
      // Use setTimeout to break the synchronous call chain
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.returnToIdle();
        }
        isHandlingBargeInRef.current = false;
      }, 0);
    } else {
      isHandlingBargeInRef.current = false;
    }
  }, []);
  
  // Function to handle text-to-speech streaming
  const speakText = useCallback(async (text: string, isFirstSentence: boolean = false) => {
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID || !text.trim()) {
      console.warn('⚠️ Cannot speak: ElevenLabs API key not configured or empty text');
      return;
    }
    
    try {
      // If this is the first sentence, update status to SPEAKING
      if (isFirstSentence && managerRef.current) {
        console.log(`🔊 [${new Date().toISOString()}] Starting speech for first sentence`);
        managerRef.current.startSpeaking();
        isSpeakingRef.current = true;
        
        // Store the current text in streamingMessage for display
        managerRef.current.updateState({
          currentStreamingMessage: {
            text: text
          }
        });
      }
      
      console.log(`🔊 [${new Date().toISOString()}] Speaking: "${text}"`);
      
      // Always create a new Audio element for each speech request
      const audioElement = new Audio();
      
      // Add to active audio elements
      activeAudioElementsRef.current.push(audioElement);
      
      // Set up event handlers before setting the source
      audioElement.onended = () => {
        console.log(`✓ [${new Date().toISOString()}] Finished speaking: "${text}"`);
        
        // Remove this audio element from active list
        activeAudioElementsRef.current = activeAudioElementsRef.current.filter(
          element => element !== audioElement
        );
        
        // Process the next sentence in the queue if any
        if (ttsQueueRef.current.length > 0) {
          const nextSentence = ttsQueueRef.current.shift();
          if (nextSentence) {
            speakText(nextSentence);
          }
        } else if (isSpeakingRef.current && managerRef.current && activeAudioElementsRef.current.length === 0) {
          // If queue is empty and we were speaking, return to IDLE
          console.log(`🔊 [${new Date().toISOString()}] Speech queue empty, returning to IDLE`);
          isSpeakingRef.current = false;
          
          // Use setTimeout to break the synchronous call chain
          setTimeout(() => {
            if (managerRef.current) {
              managerRef.current.returnToIdle();
            }
          }, 0);
        }
      };
      
      audioElement.onerror = (error) => {
        console.error(`❌ [${new Date().toISOString()}] Audio playback error:`, error);
        
        // Remove this audio element from active list
        activeAudioElementsRef.current = activeAudioElementsRef.current.filter(
          element => element !== audioElement
        );
        
        if (managerRef.current && activeAudioElementsRef.current.length === 0) {
          isSpeakingRef.current = false;
          
          // Use setTimeout to break the synchronous call chain
          setTimeout(() => {
            if (managerRef.current) {
              managerRef.current.returnToIdle();
            }
          }, 0);
        }
      };
      
      // Request audio from ElevenLabs API
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }
      
      // Get the audio blob directly
      const audioBlob = await response.blob();
      
      // Create a URL for the audio blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set the audio source and play
      audioElement.src = audioUrl;
      
      // Try to play the audio
      try {
        await audioElement.play();
      } catch (playError) {
        console.warn(`⚠️ [${new Date().toISOString()}] Initial play failed, retrying:`, playError);
        
        // Some browsers require user interaction before audio can play
        // Add a slight delay and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        await audioElement.play();
      }
      
      // Clean up the blob URL when audio is done or on error
      audioElement.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
      
      audioElement.addEventListener('error', () => {
        URL.revokeObjectURL(audioUrl);
      });
      
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] ElevenLabs TTS error:`, error);
      // Return to IDLE on error
      if (managerRef.current) {
        isSpeakingRef.current = false;
        
        // Use setTimeout to break the synchronous call chain
        setTimeout(() => {
          if (managerRef.current) {
            managerRef.current.returnToIdle();
          }
        }, 0);
      }
    }
  }, []);

  // Helper function to queue or speak text
  const queueOrSpeakText = useCallback((text: string, isFirstSentence: boolean = false) => {
    // If we're already speaking, add to queue
    if (isSpeakingRef.current && !isFirstSentence) {
      console.log(`🔊 [${new Date().toISOString()}] Queueing: "${text}"`);
      ttsQueueRef.current.push(text);
    } else {
      // Otherwise speak immediately
      speakText(text, isFirstSentence);
    }
  }, [speakText]);
  
  // Track status changes to query Claude when status changes to PROCESSING
  useEffect(() => {
    // Only proceed if status is PROCESSING, we have a finalized transcript, and concept map is not processing
    if (state.status === ConversationStatus.PROCESSING && 
        state.conversationHistory.length > 0) {
      console.log('🤖 Status changed to PROCESSING, querying Claude...');
      
      // Clear any previous TTS queue
      ttsQueueRef.current = [];
      isSpeakingRef.current = false;
      
      // Check if Anthropic client is available
      if (!anthropicClientRef.current) {
        console.error('❌ Anthropic client not initialized. Check API key.');
        return;
      }
      
      // Stream response from Claude
      const streamResponse = async () => {
        try {
          const startTime = new Date();
          
          // Use prepareClaudePrompt to get the initial system and context messages
          const contextMessages = prepareClaudePrompt(fileContext);
          
          // Convert conversation history to Claude-compatible format
          // Only include actual conversation (user/assistant) messages, not system prompts
          const conversationMessages: ClaudeMessage[] = state.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          
          // Combine system/context messages with user/assistant conversation
          // Context messages (system) come first, then the conversation
          const allMessages: ClaudeMessage[] = [...contextMessages, ...conversationMessages];
          
          // Log the complete prompt being sent
          console.log(`🔄 [${startTime.toISOString()}] Sending to Claude:`, JSON.stringify(allMessages, null, 2));
          
          let fullResponse = "";
          let currentSentenceBuffer = "";
          let sentenceCount = 0;
          
          // Track highlighted lines
          const highlightedLines = new Set<number>();
          
          // Helper function to detect sentence endings
          const isSentenceEnd = (text: string) => {
            const sentenceEndingChars = ['.', '!', '?'];
            // Check if text ends with one of these characters, possibly followed by quotes, spaces, or newlines
            return sentenceEndingChars.some(char => {
              const pattern = new RegExp(`\\${char}["')\\s\\n]*$`);
              return pattern.test(text);
            });
          };
          
          // Function to process accumulated text in the buffer
          const processSentenceBuffer = () => {
            if (currentSentenceBuffer.trim()) {
              sentenceCount++;
              const timestamp = new Date().toISOString();
              console.log(`📝 [${timestamp}] Claude sentence #${sentenceCount}: "${currentSentenceBuffer.trim()}"`);
              
              // Send to TTS, marking the first sentence
              queueOrSpeakText(currentSentenceBuffer.trim(), sentenceCount === 1);
              
              currentSentenceBuffer = "";
            }
          };
          
          const systemMessages = contextMessages.filter(msg => msg.role === 'system');
          const systemContent = systemMessages.map(msg => msg.content).join('\n\n');
  
          // Get non-system messages from context messages (should be user/assistant only)
          const nonSystemMessages = contextMessages.filter(msg => msg.role !== 'system');
  
          // Ensure only user/assistant messages from conversation history
          const filteredConversationMessages = conversationMessages.filter(
            msg => msg.role === 'user' || msg.role === 'assistant'
          );
  
          // Create a properly typed array for the Anthropic API
          // Explicitly cast to only allow 'user' | 'assistant' roles
          const apiMessages = [...nonSystemMessages, ...filteredConversationMessages].map(msg => ({
            role: (msg.role === 'user' || msg.role === 'assistant') 
              ? msg.role 
              : 'user', // Default to user if somehow not user/assistant
            content: msg.content
          }));
  
          // Make the API call with the correct structure
          await anthropicClientRef.current?.messages.stream({
            system: systemContent,
            messages: apiMessages,
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 1024,
          }).on('text', (text) => {
            fullResponse += text;
            currentSentenceBuffer += text;
            
            // Check if we've received a complete sentence
            if (isSentenceEnd(currentSentenceBuffer)) {
              processSentenceBuffer();
            }
          }).on('error', (error) => {
            console.error(`❌ [${new Date().toISOString()}] Claude API error:`, error);
          }).on('end', () => {
            // Process any remaining text in the buffer
            if (currentSentenceBuffer.trim()) {
              processSentenceBuffer();
            }
            
            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;
            
            console.log(`✅ [${endTime.toISOString()}] Claude response complete - ${duration.toFixed(2)}s`);
            console.log(`📊 Response summary: ${sentenceCount} sentences, ${fullResponse.length} characters`);
            console.log(`📄 Full response:\n${fullResponse}`);
            console.log(`🔍 Referenced lines:`, [...highlightedLines]);
            
            // If no sentences were processed, return to IDLE
            if (sentenceCount === 0 && managerRef.current) {
              // Use setTimeout to break the synchronous call chain
              setTimeout(() => {
                if (managerRef.current) {
                  managerRef.current.returnToIdle();
                }
              }, 0);
            }
            
            // Add the assistant's response to conversation history
            if (fullResponse.trim() && managerRef.current) {
              const updatedHistory = [
                ...state.conversationHistory,
                {
                  role: 'assistant' as const,
                  content: fullResponse.trim(),
                  timestamp: Date.now()
                }
              ];
              
              managerRef.current.updateState({
                conversationHistory: updatedHistory
              });
            }
          });
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Error streaming from Claude:`, error);
          // Change status back to IDLE on error
          if (managerRef.current) {
            // Use setTimeout to break the synchronous call chain
            setTimeout(() => {
              if (managerRef.current) {
                managerRef.current.returnToIdle();
              }
            }, 0);
          }
        }
      };
      
      streamResponse();
    }
  }, [state.status, state.conversationHistory, isConceptMapProcessing, queueOrSpeakText, sessionId, studentId]);
  
  // Helper function to ensure manager exists
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      console.warn('Conversation manager not initialized yet');
      return null;
    }
    return managerRef.current;
  }, []);
  
  // Exposed methods with null safety
  const startRecording = useCallback(() => {
    // If currently speaking, stop all audio playback first (barge-in support)
    if (isSpeakingRef.current) {
      cancelAllAudioPlayback();
    }
    
    const manager = getManager();
    if (manager) manager.startRecording();
  }, [getManager, cancelAllAudioPlayback]);
  
  const stopRecording = useCallback(() => {
    const manager = getManager();
    if (manager) manager.stopRecording();
  }, [getManager]);
  
  // Event subscription methods
  const onTranscriptFinalized = useCallback((callback: (data: {text: string, timestamp: number}) => void) => {
    const manager = getManager();
    if (!manager) return () => {}; // Return no-op unsubscribe if manager doesn't exist
    
    manager.on('transcriptFinalized', callback);
    return () => {
      manager.off('transcriptFinalized', callback);
    };
  }, [getManager]);
  
  return {
    // State
    ...state,
    isInitialized,
    
    // Methods
    startRecording,
    stopRecording,
    cancelAllAudioPlayback,

    // Event subscriptions
    onTranscriptFinalized
  };
};