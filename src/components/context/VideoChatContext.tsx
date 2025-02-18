import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid'
type RoleType = 'host' | 'participant';

import { VideoChatContextType } from "@/types"

const VideoChatContext = createContext<VideoChatContextType | undefined>(undefined);

export const VideoChatProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<RoleType>('participant');
  const [chatId, setChatId] = useState<string>(uuidv4());
  const [receiverId, setReceiverId] = useState<string>('');
  return (
    <VideoChatContext.Provider value={{ role, setRole, chatId, setChatId, receiverId, setReceiverId }}>
      {children}
    </VideoChatContext.Provider>
  );
};

export const useVideoChat = () => {
  const context = useContext(VideoChatContext);
  if (!context) {
    throw new Error('useVideoChat must be used within a VideoChatProvider');
  }
  return context;
}; 