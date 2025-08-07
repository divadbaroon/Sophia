import React, { useState, ReactNode, createContext, useContext } from 'react';

import { ConversationMessage, ConversationContextType } from "@/types"

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  const addMessage = (message: ConversationMessage) => {
    setConversationHistory(prev => [...prev, {
      ...message,
      timestamp: message.timestamp || Date.now()
    }]);
  };

  const value: ConversationContextType = {
    conversationHistory,
    addMessage,
    updateConversationHistory: setConversationHistory,
    clearConversation: () => setConversationHistory([]),
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};