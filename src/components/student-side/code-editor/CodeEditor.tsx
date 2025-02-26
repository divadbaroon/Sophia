'use client'

import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { useFile } from '@/components/context/FileContext';
import { EditorView } from '@codemirror/view';
import { ViewUpdate } from '@uiw/react-codemirror';

const functionTemplate = `def twoSum(self, nums: List[int], target: int) -> List[int]:
    # Write your solution here
    pass`;

const generateFullTemplate = (userCode: string): string => {
  return `from typing import List

class Solution:
    ${userCode.replace(/\n/g, '\n    ')}

# Simple function call
if __name__ == "__main__":
    solution = Solution()
    result = solution.twoSum([2, 7, 11, 15], 9)
    print(f"Result: {result}")`;
};

type CodeEditorProps = {
  className?: string;
  readOnly?: boolean;
};

const CodeEditor: React.FC<CodeEditorProps> = ({ className = '', readOnly = false }) => {
  const { 
    fileContent,
    cachedFileContent,
    updateCachedFileContent, 
    setFileContent, 
    highlightedText,
    updateHighlightedText,
    updateExecutionOutput,
    setErrorContent
  } = useFile();
  
  const editorViewRef = useRef<EditorView | null>(null);
  const [userCode, setUserCode] = useState<string>(functionTemplate);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  useEffect(() => {
    console.log("CodeEditor state:", {
      userCodeLength: userCode?.length || 0,
      fileContentLength: fileContent?.length || 0,
      cachedContentLength: cachedFileContent?.length || 0
    });
  }, [userCode, fileContent, cachedFileContent]);

  useEffect(() => {
    if (isInitialized) return;
    
    console.log("CodeEditor initializing...");
    
    // Generate and set initial content with proper indentation
    const initialFullCode = generateFullTemplate(functionTemplate);
    setFileContent(initialFullCode);
    updateCachedFileContent(initialFullCode);
    
    // Clear any previous results
    updateExecutionOutput('');
    setErrorContent('');
    
    console.log("CodeEditor initialized with template");
    setIsInitialized(true);
  }, [isInitialized, updateCachedFileContent, setFileContent, updateExecutionOutput, setErrorContent]);

  // Extract user code from full template if fileContent changes externally
  useEffect(() => {
    if (!isInitialized || !fileContent || fileContent === cachedFileContent) return;
    
    // Extract the twoSum function from the full code
    const regex = /class Solution:\n\s+(def twoSum[\s\S]*?)(?=\n\n|$)/;
    const match = fileContent.match(regex);
    
    if (match && match[1] && match[1].trim() !== userCode.trim()) {
      // Remove the 4-space indentation that comes from the class
      const extractedCode = match[1].replace(/\n\s{4}/g, '\n');
      console.log("Extracted code from fileContent:", extractedCode);
      setUserCode(extractedCode);
    }
  }, [isInitialized, fileContent, cachedFileContent, userCode]);

  // Auto-save code changes after a delay
  useEffect(() => {
    if (!isInitialized || !fileContent) return;
        
    const autoSaveDelay = 500; // ms
    
    const autoSaveTimer = setTimeout(() => {
      if (fileContent !== cachedFileContent) {
        updateCachedFileContent(fileContent);
        console.log("Auto-saved code");
      }
    }, autoSaveDelay);
    
    return () => clearTimeout(autoSaveTimer);
  }, [isInitialized, fileContent, cachedFileContent, updateCachedFileContent]);

  const handleCodeChange = (value: string): void => {
    setUserCode(value);
    
    // Generate the full template with updated user code
    const updatedTemplate = generateFullTemplate(value);
    
    // Update the file content with the new template
    setFileContent(updatedTemplate);
    
    console.log("Code updated:", {
      userCodeLength: value.length,
      updatedTemplateLength: updatedTemplate.length
    });
    
    // Clear previous execution results
    updateExecutionOutput('');
    setErrorContent('');
  };

  // Handle text selection for context
  useEffect(() => {
    const handleMouseUp = (): void => {
      if (editorViewRef.current) {
        const state = editorViewRef.current.state;
        const { from, to } = state.selection.main;
  
        if (from !== to) {
          const selectedText = state.sliceDoc(from, to);
          if (selectedText !== highlightedText) {
            updateHighlightedText(selectedText);
          }
        } else {
          updateHighlightedText('');
        }
      }
    };
  
    const editorElement = editorViewRef.current?.dom;
  
    if (editorElement) {
      editorElement.addEventListener('mouseup', handleMouseUp);
      return () => {
        editorElement.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [editorViewRef, updateHighlightedText, highlightedText]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <ScrollArea className="flex-1">
        <CodeMirror
          value={userCode}
          height="540px"
          theme={vscodeLight}
          extensions={[python()]}
          onChange={handleCodeChange}
          onUpdate={(viewUpdate: ViewUpdate): void => {
            editorViewRef.current = viewUpdate.view;
          }}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: false,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: false,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </ScrollArea>
    </div>
  );
};

export default CodeEditor;