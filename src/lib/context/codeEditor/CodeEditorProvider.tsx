'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSession } from '../session/SessionProvider';
import { useCodeSnapshots } from '@/lib/hooks/codeEditor/useCodeSnapshots'; 
import { saveSophiaHighlightAction } from '@/lib/actions/sophia-highlight-actions'
import { saveUserHighlightAction } from '@/lib/actions/user-highlight-actions'
import { saveVisualizationInteraction } from '@/lib/actions/visualization-interaction-actions'
import { useSessionEndTracking } from '@/lib/hooks/sessionTracking/useSessionEndTracking';

import { CodeEditorContextType } from "../types"

const CodeEditorContext = createContext<CodeEditorContextType | undefined>(undefined);

export const CodeEditorProvider = ({ children }: { children: ReactNode }) => {
  const { sessionData, sessionId, lessonId, activeMethodId, currentMethodIndex } = useSession();

  // Code loading state
  const [codeLoading, setCodeLoading] = useState(true);

  // Loads initial code 
  const { initialMethodsCode, isLoading } = useCodeSnapshots(sessionData, sessionId, lessonId);

  // User's latest code for all tasks
  const [methodsCode, setMethodsCode] = useState<Record<string, string>>({});

  // User's active code
  const [fileContent, setFileContent] = useState<string>('');
  // User's last saved code
  const [cachedFileContent, setCachedFileContent] = useState<string>('');

  // Compilation/runtime errors
  const [errorContent, setErrorContent] = useState('');
  // Terminal output from test runs
  const [executionOutput, setExecutionOutput] = useState<string>('');

  // Selected text in editor
  const [highlightedText, setHighlightedText] = useState<string>('');
  // Used to track how long the text has been highlighted for 
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Current cursor line
  const [lineNumber, setLineNumber] = useState<number | null>(null);

  // Code the system has indicated it would like to highlight
  const [systemHighlightedLine, setSystemHighlightedLine] = useState<number | null>(null);

  // To track visualization interactions (drawing)
  const [visualizationInteractions, setVisualizationInteractions] = useState<any[]>([]);
  const [currentSequence, setCurrentSequence] = useState<(number | string)[]>([]);

  // Drawing state ( controlled by drawing button in navbar )
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Add session end tracking here ( for now )
  useSessionEndTracking({
    sessionId,
    lessonId,
    activeMethodId,
    currentMethodIndex,
    fileContent
  });

  // Initialize methodsCode when hook finishes loading
  useEffect(() => {
    if (!isLoading && Object.keys(initialMethodsCode).length > 0) {
      setMethodsCode(initialMethodsCode);
      setCodeLoading(false);
    }
  }, [isLoading, initialMethodsCode]);

  // Update the user's code content when the user changes the task number
  useEffect(() => {
    if (!activeMethodId || !methodsCode[activeMethodId] || codeLoading) return;
    
    // 1. Get code for new method from methodsCode
    const currentMethodCode = methodsCode[activeMethodId].trim();

    // 2. Set as current fileContent
    setFileContent(currentMethodCode);

    // 3. Mark as "saved" (cached = current)
    updateCachedFileContent(currentMethodCode);
  }, [activeMethodId, methodsCode, codeLoading]);

  // Mark content as "saved"
  const updateCachedFileContent = (content: string) => {
    setCachedFileContent(content);
  };

  // Update specific method's code 
  const updateMethodsCode = (methodId: string, code: string) => {
    setMethodsCode(prev => ({
      ...prev,
      [methodId]: code
    }));
  };

  const updateSystemHighlightedLine = (line: number | null) => {
    console.log("HIGHLIGHTING LINE", line)
    setSystemHighlightedLine(line);
    
    // Save highlighted line to db
    if (line !== null) {
      saveSophiaHighlightAction({
        sessionId: sessionId,
        classId: lessonId,
        lineNumber: line
      }).then((result) => {
        if (result.success) {
          console.log("💾 Sophia highlight action saved to database");
        } else {
          console.error("❌ Failed to save highlight action:", result.error);
        }
      }).catch((error) => {
        console.error("❌ Error saving highlight action:", error);
      });
    }
  };

  // Check if current content matches saved content
  const isSaved = () => {
    return fileContent === cachedFileContent;
  };

  // Track selected text
  const updateHighlightedText = (text: string) => {
    setHighlightedText(text);
    
    // Clear any existing timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    // Only save if text is not empty and wait 3 seconds for final selection
    if (text.trim() !== '') {
      highlightTimeoutRef.current = setTimeout(() => {
        console.log("💾 Saving finalized highlight:", text);
        
        saveUserHighlightAction({
          sessionId: sessionId,
          classId: lessonId,
          highlightedText: text.trim()
        }).then((result) => {
          if (result.success) {
            console.log("💾 User highlight action saved to database");
          } else {
            console.error("❌ Failed to save user highlight action:", result.error);
          }
        }).catch((error) => {
          console.error("❌ Error saving user highlight action:", error);
        });
        
        highlightTimeoutRef.current = null;
      }, 3000); // Wait 3 seconds
    }
  };

  // Track cursor position
  const updateLineNumber = (line: number | null) => {
    setLineNumber(line);
  };

  // Store test results
  const updateExecutionOutput = async (output: string) => {
    setExecutionOutput(output);
  };

  const logVisualizationInteraction = (data: {
    task: string;
    action: 'click' | 'draw' | 'clear';
    zone: string;
    x: number;
    y: number;
  }) => {
    const interaction = { 
      ...data, 
      timestamp: new Date().toISOString(), 
      sessionId, 
      lessonId 
    };
    
    // 1. Save individual interaction (for research)
    setVisualizationInteractions(prev => [...prev, interaction]);
    
    // 2. Update current sequence (for validation)
    if (data.action === 'clear') {
      setCurrentSequence([]);
      console.log("🗑️ SEQUENCE CLEARED");
    } else if (data.zone.startsWith('node')) {
      // Check if it's DFS (numbers) or Tree (letters)
      const zoneSuffix = data.zone.replace('node', ''); // Gets '1', '2', 'D', 'E', etc.
      
      if (data.task === 'dfs') {
        // DFS: Add node numbers
        const nodeNumber = parseInt(zoneSuffix);
        setCurrentSequence(prev => {
          const lastItem = prev[prev.length - 1];
          if (lastItem === nodeNumber) {
            console.log("🚫 DUPLICATE DFS NODE IGNORED:", nodeNumber);
            return prev;
          }
          
          const newSequence = [...prev, nodeNumber];
          console.log("🎯 DFS NODE ADDED:", nodeNumber);
          console.log("📊 Current Sequence:", newSequence);
          return newSequence;
        });
      } else if (data.task === 'tree') {
        // Binary tree: Add full zone names (nodeD, nodeE, etc.)
        setCurrentSequence(prev => {
          const lastItem = prev[prev.length - 1];
          if (lastItem === data.zone) {
            console.log("🚫 DUPLICATE TREE NODE IGNORED:", data.zone);
            return prev;
          }
          
          const newSequence = [...prev, data.zone];
          console.log("🎯 TREE NODE ADDED:", data.zone);
          console.log("📊 Current Sequence:", newSequence);
          return newSequence;
        });
      }
    } else if (data.task === 'hash' && (data.zone === 'slot4Arrow' || data.zone === 'node26Arrow')) {
      // Hash table: Add zone names (prevent duplicates)
      setCurrentSequence(prev => {
        const lastItem = prev[prev.length - 1];
        if (lastItem === data.zone) {
          console.log("🚫 DUPLICATE HASH ZONE IGNORED:", data.zone);
          return prev;
        }
        
        const newSequence = [...prev, data.zone];
        console.log("🎯 HASH ZONE ADDED:", data.zone);
        console.log("📊 Current Sequence:", newSequence);
        return newSequence;
      });
    }
        
    // 3. Save visualization interaction to db
    saveVisualizationInteraction(interaction).then((result) => {
      if (result.success) {
        console.log("💾 Visualization interaction saved to database");
      } else {
        console.error("❌ Failed to save visualization interaction:", result.error);
      }
    }).catch((error) => {
      console.error("❌ Error saving visualization interaction:", error);
    });
  };

  // Add functions to control drawing
  const toggleDrawingMode = () => {
    setIsDrawingMode(prev => !prev);
  };

  const clearAllDrawings = () => {
    // This will trigger clearing in the active visualization component
    logVisualizationInteraction({
      task: activeMethodId?.includes('dfs') ? 'dfs' : 
            activeMethodId?.includes('hash') ? 'hash' : 'tree',
      action: 'clear',
      x: 0,
      y: 0,
      zone: 'global_clear'
    });
  };

  const value: CodeEditorContextType = {
    fileContent,
    cachedFileContent,
    setFileContent,
    updateCachedFileContent,
    isSaved,
    errorContent,
    setErrorContent,
    executionOutput,
    updateExecutionOutput,
    highlightedText,
    updateHighlightedText,
    lineNumber,
    updateLineNumber,
    codeLoading,
    methodsCode,
    updateMethodsCode,
    systemHighlightedLine,       
    updateSystemHighlightedLine,  
    visualizationInteractions,
    logVisualizationInteraction,
    currentSequence,
    isDrawingMode,
    toggleDrawingMode,
    clearAllDrawings,
  };

  return (
    <CodeEditorContext.Provider value={value}>
      {children}
    </CodeEditorContext.Provider>
  );
};

export const useCodeEditor = () => {
  const context = useContext(CodeEditorContext);
  if (!context) {
    throw new Error('useCodeEditor must be used within a CodeEditorProvider');
  }
  return context;
};