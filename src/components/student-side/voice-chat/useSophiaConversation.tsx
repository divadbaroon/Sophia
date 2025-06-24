import { useEffect, useRef, useCallback } from 'react';
import { ConversationManager, ConversationStatus } from '@/lib/services/ConversationManager';
import { ConversationManagerOptions } from '@/types';
import { useSophiaBrain } from './hooks/useSophiaBrain';

const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';

/**
 * Hook that integrates your existing ConversationManager with SophiaBrain
 */
export const useSophiaConversation = () => {
  const sophia = useSophiaBrain();
  const managerRef = useRef<ConversationManager | null>(null);

  // Initialize the ConversationManager
  useEffect(() => {
    if (managerRef.current) {
      return; // Already initialized
    }

    try {
      const conversationOptions: ConversationManagerOptions = {
        silenceThreshold: 2000, // 2 seconds
        deepgramApiKey: DEEPGRAM_API_KEY,
        // You can pass your fileContext here if needed
        // fileContext: yourFileContext
      };
      
      // Create ConversationManager
      const manager = new ConversationManager(conversationOptions);
      
      // Subscribe to state changes from ConversationManager
      const unsubscribe = manager.subscribe((newState) => {
        console.log('ConversationManager state update:', newState);
        
        // Map ConversationManager status to Sophia states
        switch (newState.status) {
          case ConversationStatus.IDLE:
            // Don't automatically change to listening - let Sophia control this
            break;
          case ConversationStatus.PROCESSING:
            sophia.startThinking();
            break;
          case ConversationStatus.SPEAKING:
            sophia.startSpeaking();
            break;
        }
        
        // Update current text from transcript
        if (newState.transcript && newState.transcript.trim() !== '') {
          sophia.setCurrentText(newState.transcript);
        }
        
        // Handle errors
        if (newState.error) {
          sophia.setError(newState.error);
        }
        
        // Update conversation history when it changes
        if (newState.conversationHistory && newState.conversationHistory.length > 0) {
          // Convert to Sophia's message format
          const sophiaMessages = newState.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }));
          
          // Only update if the history has actually changed
          if (JSON.stringify(sophiaMessages) !== JSON.stringify(sophia.conversationHistory)) {
            // Update Sophia's conversation history
            sophiaMessages.forEach(msg => {
              // Check if this message is already in Sophia's history
              const exists = sophia.conversationHistory.some(
                existingMsg => existingMsg.timestamp === msg.timestamp && 
                              existingMsg.content === msg.content
              );
              
              if (!exists) {
                sophia.addMessage(msg);
              }
            });
          }
        }
      });
      
      // Listen for finalized transcripts
      manager.on('transcriptFinalized', ({ text, timestamp }) => {
        console.log('Transcript finalized:', text);
        
        // Add user message to Sophia's conversation history
        sophia.addMessage({
          role: 'user',
          content: text,
          timestamp: timestamp
        });
        
        // Clear current text and start thinking
        sophia.setCurrentText('');
        sophia.startThinking();
      });
      
      // Initialize the manager
      manager.initialize();
      
      // Store reference
      managerRef.current = manager;
      
      // Cleanup function
      return () => {
        unsubscribe();
        if (managerRef.current) {
          managerRef.current.dispose();
          managerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize ConversationManager:', error);
      sophia.setError('Failed to initialize speech recognition system');
    }
  }, [sophia]);

  // Helper function to get manager safely
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      console.warn('ConversationManager not initialized yet');
      return null;
    }
    return managerRef.current;
  }, []);

  // Start recording - this will also set Sophia to listening state
  const startRecording = useCallback(() => {
    const manager = getManager();
    if (manager) {
      sophia.startListening(); // Set Sophia state
      manager.startRecording(); // Start the actual recording
    }
  }, [getManager, sophia]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    const manager = getManager();
    if (manager) {
      manager.stopRecording();
    }
  }, [getManager]);

  // Auto-start recording when Sophia state becomes 'listening'
  useEffect(() => {
    const manager = getManager();
    if (sophia.state === 'listening' && manager) {
      console.log('Auto-starting recording for listening state');
      manager.startRecording();
    } else if (sophia.state !== 'listening' && manager) {
      console.log('Auto-stopping recording - not in listening state');
      manager.stopRecording();
    }
  }, [sophia.state, getManager]);

  return {
    startRecording,
    stopRecording,
    isRecording: sophia.state === 'listening',
    isInitialized: managerRef.current !== null && DEEPGRAM_API_KEY !== ''
  };
};