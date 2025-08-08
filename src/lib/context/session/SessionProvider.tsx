'use client'

import React, { useState, createContext, useContext, ReactNode } from 'react';

import { useSessionUrl } from '@/lib/hooks/session/useSessionUrl';
import { useSessionData } from '@/lib/hooks/session/useSessionData';
import { useTaskNavigation } from '@/lib/hooks/taskNavigation/useTaskNavigation';

import { SessionContextType } from "@/lib/context/types"

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Extract session and lesson IDs from URL
  const { sessionId, lessonId } = useSessionUrl();
  
  // Load session data
  const { sessionData, isLoadingTasks } = useSessionData(lessonId);
  
  // Handle task navigation
  const {
    currentMethodIndex,
    setCurrentMethodIndex,
    activeMethodId,
    currentTestCases,
    goToNextMethod,
    goToPrevMethod,
  } = useTaskNavigation(sessionData);

  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set())
  const [lastCompletedTask, setLastCompletedTask] = useState<number | null>(null)

  const markTaskCompleted = (taskIndex: number) => {
    setCompletedTasks((prev: Set<number>) => {
      const newSet = new Set(prev)
      newSet.add(taskIndex)
      return newSet
    })
    setLastCompletedTask(taskIndex)  
  }

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

    completedTasks,
    markTaskCompleted,
    lastCompletedTask,  
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