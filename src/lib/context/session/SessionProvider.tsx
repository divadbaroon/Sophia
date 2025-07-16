'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { TaskData, TestCase } from '@/types';
import { getCodingTasksForLesson } from '@/lib/actions/coding-tasks-actions';

import { SessionContextType } from "../types"

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  
  // Core session state
  const [sessionId, setSessionId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [sessionData, setSessionData] = useState<TaskData | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  // Navigation state
  const [currentMethodIndex, setCurrentMethodIndex] = useState<number>(0);
  const [activeMethodId, setActiveMethodId] = useState<string>('');
  const [currentTestCases, setCurrentTestCases] = useState<TestCase[]>([]);
  const [studentTask, setStudentTask] = useState<string>('');

  // Extract lesson ID and session ID from URL
  useEffect(() => {
    // Match pattern: /concepts/[lessonId]/session/[sessionId]
    const urlMatch = pathname?.match(/\/concepts\/([^\/]+)\/session\/([^\/]+)/);
    
    if (urlMatch) {
      const [, newLessonId, newSessionId] = urlMatch;
      
      if (newLessonId !== lessonId || newSessionId !== sessionId) {
        console.log("URL changed - Lesson ID:", newLessonId, "Session ID:", newSessionId);
        setLessonId(newLessonId);
        setSessionId(newSessionId);
        setCurrentMethodIndex(0); // Reset to first task
      }
    }
  }, [pathname, lessonId, sessionId]);

  // Load coding tasks when lesson ID changes
  useEffect(() => {
    const loadCodingTasks = async () => {
      if (!lessonId) return;
      
      setIsLoadingTasks(true);
      
      try {
        const result = await getCodingTasksForLesson(lessonId);
        
        if (result.data) {
          const taskData: TaskData = {
            tasks: result.data.tasks,
            methodTemplates: result.data.methodTemplates,
            testCases: result.data.testCases,
            conceptMappings: result.data.conceptMappings,
            system: result.data.system
          };
          
          setSessionData(taskData);
          console.log('✅ Session data loaded successfully');
        } else {
          console.error('Failed to load coding tasks:', result.error);
        }
      } catch (error) {
        console.error('Error loading coding tasks:', error);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadCodingTasks();
  }, [lessonId]);

  // Helper function to extract method ID from title
  const extractMethodIdFromTitle = (title: string): string | null => {
    const match = title.match(/(?:\d+\.\)\s+)?([a-zA-Z_]+)\(\)/);
    return match ? match[1] : null;
  };

  // Update active method ID and test cases when method index or session changes
  useEffect(() => {
    if (sessionData?.tasks && sessionData.tasks[currentMethodIndex]) {
      const title = sessionData.tasks[currentMethodIndex].title;
      console.log("🔍 Extracting methodId from title:", title);
      
      const methodId = extractMethodIdFromTitle(title);
      
      if (methodId) {
        console.log("✅ Found methodId:", methodId);
        setActiveMethodId(methodId);
        
        if (sessionData.testCases[methodId]) {
          setCurrentTestCases(sessionData.testCases[methodId]);
        }
      } else {
        console.error("❌ Could not extract methodId from title:", title);
      }
    }
  }, [currentMethodIndex, sessionData]);

  // Update student task when method changes
  useEffect(() => {
    if (sessionData?.tasks && sessionData.tasks[currentMethodIndex]) {
      const currentTask = sessionData.tasks[currentMethodIndex];
      
      // Build formatted task description
      const examplesText = currentTask.examples.map((example, index) => {
        const inputText = Object.entries(example.input)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        return `Example ${index + 1}:\nInput: ${inputText}\nOutput: ${example.output}`;
      }).join('\n\n');
      
      const taskDescription = `${currentTask.title}

  ${currentTask.description}

  Examples:
  ${examplesText}`.trim();
      
      setStudentTask(taskDescription);
      console.log('📝 Updated student task for:', currentTask.title);
    }
  }, [currentMethodIndex, sessionData]);

  // Navigation methods
  const goToNextMethod = () => {
    if (sessionData && currentMethodIndex < sessionData.tasks.length - 1) {
      setCurrentMethodIndex(currentMethodIndex + 1);
    }
  };
  
  const goToPrevMethod = () => {
    if (currentMethodIndex > 0) {
      setCurrentMethodIndex(currentMethodIndex - 1);
    }
  };

  // Template helpers
  const getCurrentMethodTemplate = () => {
    if (activeMethodId && sessionData?.methodTemplates) {
      return sessionData.methodTemplates[activeMethodId];
    }
    return '';
  };

  const getAllMethodTemplates = () => {
    return sessionData?.methodTemplates || {};
  };

  const value: SessionContextType = {
    sessionId,
    lessonId,
    currentMethodIndex,
    activeMethodId,
    setCurrentMethodIndex,
    sessionData,
    isLoadingTasks,
    currentTestCases,
    studentTask,
    goToNextMethod,
    goToPrevMethod,
    getCurrentMethodTemplate,
    getAllMethodTemplates,
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