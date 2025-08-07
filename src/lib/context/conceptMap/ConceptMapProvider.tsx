'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { useSession } from '../session/SessionProvider';
import { useCodeEditor } from '../codeEditor/CodeEditorProvider';
import { useConversation } from '../conversation/conversationHistoryProvider';

import {
  loadStudentConceptMapWithFallback,
  saveStudentConceptMap,
} from '@/lib/actions/student-concept-map-actions';

import { extractMethodIdFromTitle } from "@/utils/string-parsing/string-utils"

import { ConceptMapContextType } from "../types"

const ConceptMapContext = createContext<ConceptMapContextType | undefined>(undefined);

export const ConceptMapProvider = ({ children }: { children: ReactNode }) => {
  // Session data
  const { sessionData, sessionId, lessonId, activeMethodId, currentMethodIndex } = useSession();
  // Session code content
  const { fileContent, executionOutput } = useCodeEditor();
  // Session conversation history 
  const { conversationHistory } = useConversation()

  // Concept map state
  const [conceptMap, setConceptMap] = useState<any>(null);
  const [conceptMapsPerMethod, setConceptMapsPerMethod] = useState<Record<string, any>>({});
  const [isLoadingConceptMaps, setIsLoadingConceptMaps] = useState(false);

  // API update state
  const [lastConceptMapUpdate, setLastConceptMapUpdate] = useState<number>(Date.now());
  const [isUpdatingConceptMap, setIsUpdatingConceptMap] = useState(false);

  // Load concept maps for all methods
  const loadConceptMapsForAllMethods = async (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return;
    
    setIsLoadingConceptMaps(true);
    const conceptMaps: Record<string, any> = {};
    
    try {
      for (const task of tasks) {
        const methodId = extractMethodIdFromTitle(task.title);
        if (!methodId) continue;
        
        console.log(`📊 Loading concept map for ${methodId}`);
        
        const result = await loadStudentConceptMapWithFallback(
          task.id, // codingTaskId
          methodId  // methodTitle
        );
        
        if (result.data) {
          conceptMaps[methodId] = result.data;
          console.log(`✅ Loaded concept map for ${methodId} from ${result.source}`);
        } else {
          console.warn(`⚠️ No concept map available for ${methodId}:`, result.error);
        }
      }
      
      setConceptMapsPerMethod(conceptMaps);
      
      // Set the concept map for the first method (if available)
      const firstTask = tasks[0];
      if (firstTask) {
        const firstMethodId = extractMethodIdFromTitle(firstTask.title);
        if (firstMethodId && conceptMaps[firstMethodId]) {
          setConceptMap(conceptMaps[firstMethodId]);
        }
      }
      
    } catch (error) {
      console.error('Error loading concept maps:', error);
    } finally {
      setIsLoadingConceptMaps(false);
    }
  };

  // Load concept maps when session data is available
  useEffect(() => {
    if (sessionData?.tasks) {
      loadConceptMapsForAllMethods(sessionData.tasks);
    }
  }, [sessionData]);

  // Update concept map when active method changes
  useEffect(() => {
    if (activeMethodId && conceptMapsPerMethod[activeMethodId]) {
      setConceptMap(conceptMapsPerMethod[activeMethodId]);
      console.log(`📊 Switched to concept map for ${activeMethodId}`);
    }
  }, [activeMethodId, conceptMapsPerMethod]);

  // Helper functions
  const updateConceptMap = (newConceptMap: any) => {
    setConceptMap(newConceptMap);
    
    // Also update the per-method concept maps
    if (activeMethodId) {
      setConceptMapsPerMethod(prev => ({
        ...prev,
        [activeMethodId]: newConceptMap
      }));
    }
  };

  // Check if concept map should be updated
  const shouldUpdateConceptMap = (): boolean => {
    // Don't update if already updating or if data isn't ready
    if (isUpdatingConceptMap || !sessionData || !activeMethodId || isLoadingConceptMaps) {
      return false;
    }
    
    // Don't update too frequently (minimum 5 seconds between updates)
    const timeSinceLastUpdate = Date.now() - lastConceptMapUpdate;
    return timeSinceLastUpdate > 5000;
  };

  // Listen for task changes and update concept map
  useEffect(() => {
    if (activeMethodId) {
      // Only update if this isn't the initial load
      if (conceptMapsPerMethod[activeMethodId]) {
        updateConceptMapFromAPI('task_change');
      }
    }
  }, [activeMethodId]);

  // Listen for test execution and update concept map
  useEffect(() => {
    if (executionOutput && executionOutput.trim().length > 0) {
      updateConceptMapFromAPI('test_run');
    }
  }, [executionOutput]);

  // Listen for conversation history changes, in which rerun concept map
  useEffect(() => {
    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage.content.length > 10) {
        updateConceptMapFromAPI('conversation');
      }
    }
  }, [conversationHistory]);

  // Function to call the concept map API
  const updateConceptMapFromAPI = async (trigger: 'test_run' | 'conversation' | 'task_change') => {
    if (!shouldUpdateConceptMap()) return;
    
    setIsUpdatingConceptMap(true);
    
    try {
      // Get current task data
      const currentTask = sessionData?.tasks[currentMethodIndex];
      if (!currentTask) return;
      
      // Get current method template
      const methodTemplate = sessionData?.methodTemplates[activeMethodId] || '';
      
      // Get the current concept map for this method
      const currentMethodConceptMap = conceptMapsPerMethod[activeMethodId] || {};
      
      // Prepare context for the API
      const context = {
        taskName: currentTask.title,
        methodName: activeMethodId,
        methodTemplate: methodTemplate,
        currentStudentCode: fileContent,
        terminalOutput: executionOutput,
        conversationHistory: conversationHistory,
        currentConceptMap: currentMethodConceptMap,
        sessionId: sessionId,
      };
      
      // Call the concept map API route
      const response = await fetch('/api/claude/concept-map/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: context
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update concept map: ${response.statusText}`);
      }
      
      const result = await response.json();

      // Update the concept map state
      updateConceptMap(result.updatedConceptMap);
      setLastConceptMapUpdate(Date.now());
      
      // Save updated concept map to database
      if (currentTask.id) {
        saveStudentConceptMap(
          lessonId,
          currentTask.id,
          activeMethodId,
          result.updatedConceptMap
        );
      }
      
      console.log(`📊 Concept map updated for ${activeMethodId} (trigger: ${trigger})`);
      
    } catch (error) {
      console.error('Failed to update concept map:', error);
    } finally {
      setIsUpdatingConceptMap(false);
    }
  };

  const value: ConceptMapContextType = {
    conceptMap,
    updateConceptMap,
    conceptMapsPerMethod,
    isLoadingConceptMaps,
    isUpdatingConceptMap,
  };

  return (
    <ConceptMapContext.Provider value={value}>
      {children}
    </ConceptMapContext.Provider>
  );
};

export const useConceptMap = () => {
  const context = useContext(ConceptMapContext);
  if (!context) {
    throw new Error('useConceptMap must be used within a ConceptMapProvider');
  }
  return context;
};