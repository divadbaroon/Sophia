'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getTaskProgressForSession,
  markTaskCompleted as dbMarkTaskCompleted,
  recordTaskAttempt,
} from '@/lib/actions/task-progress-actions';
import { useSession } from '../session/SessionProvider';

import { TaskProgressContextType } from "../types"

const TaskProgressContext = createContext<TaskProgressContextType | undefined>(undefined);

export const TaskProgressProvider = ({ children }: { children: ReactNode }) => {
  const { sessionId, sessionData, currentMethodIndex } = useSession();

  // Progress state
  const [taskCompletionStatus, setTaskCompletionStatus] = useState<Record<string, Record<number, boolean>>>({});
  const [isLoadingTaskProgress, setIsLoadingTaskProgress] = useState(false);

  // Load completion status from database when session changes
  useEffect(() => {
    const loadTaskProgress = async () => {
      if (!sessionId) return;
      
      setIsLoadingTaskProgress(true);
      
      try {
        // Try to load from database first
        const result = await getTaskProgressForSession(sessionId);
        
        if (result.success && result.data) {
          // Convert database format to local state format
          const progressMap: Record<number, boolean> = {};
          result.data.forEach((progress: any) => {
            progressMap[progress.task_index] = progress.completed;
          });
          
          setTaskCompletionStatus(prev => ({
            ...prev,
            [sessionId]: progressMap
          }));
          
          console.log('✅ Loaded task progress from database:', progressMap);
        } else {
          // Fallback to localStorage if database fails
          console.log('⚠️ Database load failed, trying localStorage...');
          const storageKey = `task_completion_${sessionId}`;
          const saved = localStorage.getItem(storageKey);
          
          if (saved) {
            try {
              const completedData = JSON.parse(saved);
              setTaskCompletionStatus(prev => ({
                ...prev,
                [sessionId]: completedData
              }));
              console.log('📱 Loaded task progress from localStorage:', completedData);
            } catch (error) {
              console.error('Error parsing localStorage data:', error);
              initializeEmptyProgress();
            }
          } else {
            initializeEmptyProgress();
          }
        }
      } catch (error) {
        console.error('Error loading task progress:', error);
        initializeEmptyProgress();
      } finally {
        setIsLoadingTaskProgress(false);
      }
    };

    const initializeEmptyProgress = () => {
      const initialStatus: Record<number, boolean> = {};
      for (let index = 0; index < (sessionData?.tasks.length || 0); index++) {
        initialStatus[index] = false;
      }
      setTaskCompletionStatus(prev => ({
        ...prev,
        [sessionId]: initialStatus
      }));
      console.log('🔄 Initialized empty task progress');
    };

    if (sessionId && sessionData) {
      loadTaskProgress();
    }
  }, [sessionId, sessionData]);

  // Progress actions
  const markTaskCompleted = async (taskIndex: number, testCasesPassed?: number, totalTestCases?: number) => {
    if (!sessionId) return;
    
    // Update local state immediately for responsive UI
    setTaskCompletionStatus(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [taskIndex]: true
      }
    }));
    
    // Save to database
    try {
      const result = await dbMarkTaskCompleted(sessionId, taskIndex, testCasesPassed, totalTestCases);
      if (result.success) {
        console.log(`✅ Task ${taskIndex} completion saved to database`);
      } else {
        console.error('❌ Failed to save task completion to database:', result.error);
      }
    } catch (error) {
      console.error('❌ Error saving task completion:', error);
    }
  };

  const recordAttempt = async (taskIndex: number, testCasesPassed: number, totalTestCases: number) => {
    if (!sessionId) return;
    
    try {
      const result = await recordTaskAttempt(sessionId, taskIndex, testCasesPassed, totalTestCases);
      if (result.success) {
        console.log(`📝 Task ${taskIndex} attempt recorded: ${testCasesPassed}/${totalTestCases} test cases passed`);
      } else {
        console.error('❌ Failed to record task attempt:', result.error);
      }
    } catch (error) {
      console.error('❌ Error recording task attempt:', error);
    }
  };

  // Progress queries
  const isTaskCompleted = (taskIndex: number): boolean => {
    if (!sessionId) return false;
    return taskCompletionStatus[sessionId]?.[taskIndex] || false;
  };

  const isTaskUnlocked = (taskIndex: number): boolean => {
    if (taskIndex === 0) return true;
    return isTaskCompleted(taskIndex - 1);
  };

  const canGoToNext = (): boolean => {
    if (!sessionData) return false;
    if (currentMethodIndex >= sessionData.tasks.length - 1) return false;
    return isTaskCompleted(currentMethodIndex);
  };

  const getCompletionStats = () => {
    if (!sessionId || !sessionData) return { completed: 0, total: 0 };
    
    const sessionStatus = taskCompletionStatus[sessionId] || {};
    const completed = Object.values(sessionStatus).filter(Boolean).length;
    const total = sessionData.tasks.length;
    return { completed, total };
  };

  const value: TaskProgressContextType = {
    taskCompletionStatus,
    isLoadingTaskProgress,
    markTaskCompleted,
    recordAttempt,
    isTaskCompleted,
    isTaskUnlocked,
    canGoToNext,
    getCompletionStats,
  };

  return (
    <TaskProgressContext.Provider value={value}>
      {children}
    </TaskProgressContext.Provider>
  );
};

export const useTaskProgress = () => {
  const context = useContext(TaskProgressContext);
  if (!context) {
    throw new Error('useTaskProgress must be used within a TaskProgressProvider');
  }
  return context;
};