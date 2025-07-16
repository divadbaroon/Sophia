'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadAllCodeSnapshots } from '@/lib/actions/code-snapshot-actions';
import { useSession } from '../session/SessionProvider';

import { CodeEditorContextType } from "../types"

const CodeEditorContext = createContext<CodeEditorContextType | undefined>(undefined);

export const CodeEditorProvider = ({ children }: { children: ReactNode }) => {
  const { sessionData, sessionId, lessonId, activeMethodId } = useSession();

  // File content state
  const [fileContent, setFileContent] = useState<string>('');
  const [cachedFileContent, setCachedFileContent] = useState<string>('');

  // Error and execution state
  const [errorContent, setErrorContent] = useState('');
  const [executionOutput, setExecutionOutput] = useState<string>('');

  // Text selection and highlighting
  const [highlightedText, setHighlightedText] = useState<string>('');
  const [lineNumber, setLineNumber] = useState<number | null>(null);

  // Code management
  const [codeLoading, setCodeLoading] = useState(true);
  const [methodsCode, setMethodsCode] = useState<Record<string, string>>({});

  // Load code snapshots when session and lesson data are ready
  useEffect(() => {
    const loadCodeSnapshots = async () => {
      if (!sessionData?.methodTemplates || !sessionId || !lessonId) return;
      
      console.log("Loading code snapshots for session", sessionId);
      setCodeLoading(true);
      
      try {
        // Start with templates as fallback
        const initialMethodsCode = { ...sessionData.methodTemplates };
        
        // Try to load saved code from database
        const result = await loadAllCodeSnapshots(sessionId, lessonId);
        
        if (result.success && result.methodsCode) {
          console.log("Found saved code in database for session", sessionId);
          
          // Merge saved code with templates (saved code takes priority)
          Object.keys(sessionData.methodTemplates).forEach(methodId => {
            if (result.methodsCode![methodId]) {
              initialMethodsCode[methodId] = result.methodsCode![methodId];
            }
          });
          
          console.log("Using saved code from database");
        } else {
          console.log("No saved code found, using templates");
        }
        
        // Set the methods code
        setMethodsCode(initialMethodsCode);
        
        console.log("Code snapshots loaded successfully");
      } catch (error) {
        console.error("Error loading code snapshots:", error);
        // Fallback to templates only
        setMethodsCode({ ...sessionData.methodTemplates });
      } finally {
        setCodeLoading(false);
      }
    };

    loadCodeSnapshots();
  }, [sessionData, sessionId, lessonId]);

  // Update file content when active method changes
  useEffect(() => {
    if (!activeMethodId || !methodsCode[activeMethodId] || codeLoading) return;
    
    const currentMethodCode = methodsCode[activeMethodId].trim();
    console.log("Setting initial file content for method:", activeMethodId);
    setFileContent(currentMethodCode);
    updateCachedFileContent(currentMethodCode);
  }, [activeMethodId, methodsCode, codeLoading]);

  const updateCachedFileContent = (content: string) => {
    setCachedFileContent(content);
  };

  const updateHighlightedText = (text: string) => {
    setHighlightedText(text);
  };

  const updateLineNumber = (line: number | null) => {
    setLineNumber(line);
  };

  const updateMethodsCode = (methodId: string, code: string) => {
    setMethodsCode(prev => ({
      ...prev,
      [methodId]: code
    }));
  };

  const updateExecutionOutput = async (output: string) => {
    setExecutionOutput(output);
  };

  const isSaved = () => {
    return fileContent === cachedFileContent;
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