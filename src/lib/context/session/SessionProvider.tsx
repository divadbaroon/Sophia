'use client'

import React, { createContext, useContext, ReactNode } from 'react';

import { useSessionUrl } from '@/lib/hooks/session/useSessionURL';
import { useSessionData } from '@/lib/hooks/session/useSessionData';
import { useTaskNavigation } from '@/lib/hooks/taskNavigation/useTaskNavigation';

import { SessionContextType } from "@/lib/context/types"

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Hook 1: Extract session and lesson IDs from URL
  const { sessionId, lessonId } = useSessionUrl();
  
  // Hook 2: Load session data
  const { sessionData, isLoadingTasks } = useSessionData(lessonId);
  
  // Hook 3: Handle task navigation
  const {
    currentMethodIndex,
    setCurrentMethodIndex,
    activeMethodId,
    currentTestCases,
    goToNextMethod,
    goToPrevMethod,
  } = useTaskNavigation(sessionData);

  const value: SessionContextType = {
    // Core session data
    sessionId,
    lessonId,
    sessionData,
    
    isLoadingTasks,
    
    // Navigation 
    currentMethodIndex,
    activeMethodId,
    currentTestCases,
    setCurrentMethodIndex,
    goToNextMethod,
    goToPrevMethod,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};