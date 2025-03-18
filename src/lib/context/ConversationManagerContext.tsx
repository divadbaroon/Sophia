'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { useConversationManager } from '@/lib/hooks/useConversationManager';
import { ConversationState, StreamingSentence } from '@/types';

// Create a type that extends ConversationState with all the methods
type ConversationManagerContextType = ConversationState & {
  isInitialized: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  queryClaudeWithText: (text: string) => void;
  toggleAutoTTS: () => void;
  speakLastResponse: () => void;
  stopSpeaking: () => void;
  clearError: () => void;
  analyzeCode: (code: string) => void;
  createUnderstandingMatrix: (problemDescription: string) => Promise<{
    categories: {
      [category: string]: {
        [subcategory: string]: number
      }
    }
  }>;
  updateCategory: (
    category: string, 
    currentUnderstanding: {[subcategory: string]: number}
  ) => Promise<{[subcategory: string]: number}>;
  createPivot: (
    understandingMatrix: {
      categories: {
        [category: string]: {
          [subcategory: string]: number
        }
      }
    }
  ) => Promise<string>;
  onSentenceAdded: (callback: (data: {messageId: string, sentence: StreamingSentence}) => void) => () => void;
  onMessageCompleted: (callback: (data: {
    messageId: string, 
    content: string, 
    sentences: StreamingSentence[], 
    duration: number
  }) => void) => () => void;
};

// Create the context
const ConversationManagerContext = createContext<ConversationManagerContextType | undefined>(undefined);

// Provider component
export const ConversationManagerProvider = ({ children }: { children: ReactNode }) => {
  const conversationManager = useConversationManager();
  
  return (
    <ConversationManagerContext.Provider value={conversationManager}>
      {children}
    </ConversationManagerContext.Provider>
  );
};

// Hook to use the context
export const useConversationManagerContext = (): ConversationManagerContextType => {
  const context = useContext(ConversationManagerContext);
  
  if (context === undefined) {
    throw new Error('useConversationManagerContext must be used within a ConversationManagerProvider');
  }
  
  return context;
};