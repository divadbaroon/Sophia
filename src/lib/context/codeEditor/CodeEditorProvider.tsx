'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSession } from '../session/SessionProvider';
import { useCodeSnapshots } from '@/lib/hooks/codeEditor/useCodeSnapshots'; 
import { saveSophiaHighlightAction } from '@/lib/actions/sophia-highlight-actions'
import { saveUserHighlightAction } from '@/lib/actions/user-highlight-actions'

import { CodeEditorContextType } from "../types"

const CodeEditorContext = createContext<CodeEditorContextType | undefined>(undefined);

export const CodeEditorProvider = ({ children }: { children: ReactNode }) => {
  const { sessionData, sessionId, lessonId, activeMethodId } = useSession();

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