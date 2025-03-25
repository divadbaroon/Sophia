'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useConversationManager } from '@/lib/hooks/useConversationManager';
import { ConversationState } from '@/types';

// Create a type that extends ConversationState with all the methods
type ConversationManagerContextType = ConversationState & {
  isInitialized: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  cancelAllAudioPlayback: () => void; // Added function for barge-in support
  onTranscriptFinalized: (callback: (data: {
    text: string, 
    timestamp: number
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