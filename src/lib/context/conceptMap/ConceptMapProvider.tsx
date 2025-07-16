'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConversationMessage } from '@/types';
import {
  loadStudentConceptMapWithFallback,
  saveStudentConceptMap,
} from '@/lib/actions/student-concept-map-actions';
import { useSession } from '../session/SessionProvider';
import { useCodeEditor } from '../codeEditor/CodeEditorProvider';

interface ConceptMapContextType {
  // Concept map state
  conceptMap: any;
  updateConceptMap: (newConceptMap: any) => void;
  conceptMapsPerMethod: Record<string, any>;
  isLoadingConceptMaps: boolean;

  // Concept map confidence and pivots
  conceptMapConfidenceMet: boolean;
  updateConceptMapConfidence: (isConfident: boolean) => void;
  latestPivotMessage: string | null;
  updateLatestPivotMessage: (message: string | null) => void;
  pivotQueue: Array<{ concept: string; category: string; confidence: number }>;
  updatePivotQueue: (queue: Array<{ concept: string; category: string; confidence: number }>) => void;
  conceptMapInitializing: boolean;
  updateConceptMapInitializing: (isInitializing: boolean) => void;

  // Conversation state
  conversationHistory: ConversationMessage[];
  updateConversationHistory: (newHistory: ConversationMessage[]) => Promise<void>;

  // Report state
  showReport: boolean;
  setShowReport: React.Dispatch<React.SetStateAction<boolean>>;

  // API update state
  isUpdatingConceptMap: boolean;
}

const ConceptMapContext = createContext<ConceptMapContextType | undefined>(undefined);

export const ConceptMapProvider = ({ children }: { children: ReactNode }) => {
  const { sessionData, sessionId, lessonId, activeMethodId, currentMethodIndex } = useSession();
  const { fileContent, executionOutput, registerExecutionOutputCallback } = useCodeEditor();

  // Concept map state
  const [conceptMap, setConceptMap] = useState<any>(null);
  const [conceptMapsPerMethod, setConceptMapsPerMethod] = useState<Record<string, any>>({});
  const [isLoadingConceptMaps, setIsLoadingConceptMaps] = useState(false);

  // Concept map confidence and pivots
  const [conceptMapConfidenceMet, setConceptMapConfidenceMet] = useState(false);
  const [latestPivotMessage, setLatestPivotMessage] = useState<string | null>(null);
  const [pivotQueue, setPivotQueue] = useState<Array<{ concept: string; category: string; confidence: number }>>([]);
  const [conceptMapInitializing, setConceptMapInitializing] = useState(false);

  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  // Report state
  const [showReport, setShowReport] = useState(false);

  // API update state
  const [lastConceptMapUpdate, setLastConceptMapUpdate] = useState<number>(Date.now());
  const [isUpdatingConceptMap, setIsUpdatingConceptMap] = useState(false);

  // Helper function to extract method ID from title
  const extractMethodIdFromTitle = (title: string): string | null => {
    const match = title.match(/(?:\d+\.\)\s+)?([a-zA-Z_]+)\(\)/);
    return match ? match[1] : null;
  };

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

  // Register execution output callback for concept map updates
  useEffect(() => {
    const handleExecutionOutput = async (output: string) => {
      if (output.trim()) {
        await updateConceptMapFromAPI('test_run');
      }
    };

    registerExecutionOutputCallback(handleExecutionOutput);
  }, [registerExecutionOutputCallback]);

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

  const updateConceptMapConfidence = (isConfident: boolean) => {
    setConceptMapConfidenceMet(isConfident);
  };

  const updateLatestPivotMessage = (message: string | null) => {
    setLatestPivotMessage(message);
  };

  const updatePivotQueue = (queue: Array<{concept: string, category: string, confidence: number}>) => {
    setPivotQueue(queue);
  };

  const updateConceptMapInitializing = (isInitializing: boolean) => {
    setConceptMapInitializing(isInitializing);
    console.log(`Concept map initialization state updated to: ${isInitializing ? 'initializing' : 'complete'}`);
  };

  const updateConversationHistory = async (newHistory: ConversationMessage[]) => {
    setConversationHistory(newHistory);
    
    // Trigger concept map update if conversation has meaningful new content
    if (newHistory.length > conversationHistory.length) {
      const lastMessage = newHistory[newHistory.length - 1];
      if (lastMessage.content.length > 10) { // Only for substantial messages
        await updateConceptMapFromAPI('conversation');
      }
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

  // Function to call the concept map API
  const updateConceptMapFromAPI = async (trigger: 'test_run' | 'conversation') => {
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

      // Log what concept map returned
      console.log('🔍 Raw API response:', result);
      console.log('📊 Updated concept map:', result.updatedConceptMap);
      console.log('🔄 Previous concept map:', currentMethodConceptMap);
      
      // Update the concept map state
      updateConceptMap(result.updatedConceptMap);
      setLastConceptMapUpdate(Date.now());
      
      // Save updated concept map to database
      if (currentTask.id) {
        await saveStudentConceptMap(
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
    conceptMapConfidenceMet,
    updateConceptMapConfidence,
    latestPivotMessage,
    updateLatestPivotMessage,
    pivotQueue,
    updatePivotQueue,
    conceptMapInitializing,
    updateConceptMapInitializing,
    conversationHistory,
    updateConversationHistory,
    showReport,
    setShowReport,
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