import { useState, useEffect, useRef, useCallback } from 'react';
import { ConversationManager, ConversationManagerOptions, ConversationState, StreamingSentence } from '@/lib/services/ConversationManager';
import { ElevenLabsService, ElevenLabsOptions } from '@/lib/services/ElevenLabsService';
import { useFile } from '@/components/context/FileContext';

// Get environment variables
const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'default';

export const useConversationManager = () => {
  // Get file context for sending to Claude
  const fileContext = useFile();
  
  // State to synchronize with the manager
  const [state, setState] = useState<ConversationState>({
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: "",
    conversationHistory: [],
    currentStreamingMessage: null,
    error: null,
    autoTTS: true
  });
  
  // Manager reference
  const managerRef = useRef<ConversationManager | null>(null);
  
  // Initialize the manager
  useEffect(() => {
    // Configure services
    const elevenLabsOptions: ElevenLabsOptions = {
      voiceId: ELEVENLABS_VOICE_ID,
      stability: 0.5,
      similarityBoost: 0.75
    };
    
    const conversationOptions: ConversationManagerOptions = {
      silenceThreshold: 2000, // 2 seconds
      deepgramApiKey: DEEPGRAM_API_KEY,
      fileContext
    };
    
    // Create services
    const elevenLabsService = new ElevenLabsService(elevenLabsOptions);
    const manager = new ConversationManager(conversationOptions, elevenLabsService);
    
    // Subscribe to state changes
    const unsubscribe = manager.subscribe(setState);
    
    // Initialize
    manager.initialize();
    
    // Set up event listeners for streaming events
    manager.on('sentenceAdded', ({ messageId, sentence }) => {
      console.log(`[EVENT] Sentence added to message ${messageId}:`, sentence.text);
    });
    
    manager.on('messageCompleted', ({ messageId, content, sentences, duration }) => {
      console.log(`[EVENT] Message ${messageId} completed in ${duration}ms`);
    });
    
    manager.on('streamingError', ({ error }) => {
      console.error('[EVENT] Streaming error:', error);
    });
    
    // Store reference
    managerRef.current = manager;
    
    // Cleanup
    return () => {
      unsubscribe();
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [fileContext]);
  
  // Helper function to ensure manager exists
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      throw new Error('Conversation manager not initialized');
    }
    return managerRef.current;
  }, []);
  
  // Exposed methods
  const startRecording = useCallback(() => {
    getManager().startRecording();
  }, [getManager]);
  
  const stopRecording = useCallback(() => {
    getManager().stopRecording();
  }, [getManager]);
  
  const queryClaudeWithText = useCallback((text: string) => {
    getManager().queryClaudeWithText(text);
  }, [getManager]);
  
  const toggleAutoTTS = useCallback(() => {
    getManager().toggleAutoTTS();
  }, [getManager]);
  
  const speakLastResponse = useCallback(() => {
    getManager().speakLastClaudeResponse();
  }, [getManager]);
  
  const stopSpeaking = useCallback(() => {
    getManager().stopSpeaking();
  }, [getManager]);
  
  const clearError = useCallback(() => {
    getManager().clearError();
  }, [getManager]);
  
  const analyzeCode = useCallback((code: string) => {
    getManager().analyzeCode(code);
  }, [getManager]);
  
  // Event subscription methods
  const onSentenceAdded = useCallback((callback: (data: {messageId: string, sentence: StreamingSentence}) => void) => {
    const manager = getManager();
    manager.on('sentenceAdded', callback);
    return () => {
      manager.off('sentenceAdded', callback);
    };
  }, [getManager]);
  
  const onMessageCompleted = useCallback((callback: (data: {
    messageId: string, 
    content: string, 
    sentences: StreamingSentence[], 
    duration: number
  }) => void) => {
    const manager = getManager();
    manager.on('messageCompleted', callback);
    return () => {
      manager.off('messageCompleted', callback);
    };
  }, [getManager]);
  
  return {
    // State
    ...state,
    
    // Methods
    startRecording,
    stopRecording,
    queryClaudeWithText,
    toggleAutoTTS,
    speakLastResponse,
    stopSpeaking,
    clearError,
    analyzeCode,
    
    // Event subscriptions
    onSentenceAdded,
    onMessageCompleted
  };
};