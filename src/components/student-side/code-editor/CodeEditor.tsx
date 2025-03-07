'use client'

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { useFile } from '@/lib/context/FileContext';
import { EditorView } from '@codemirror/view';
import { ViewUpdate } from '@uiw/react-codemirror';
import { SelectionRange, EditorState, Extension } from '@codemirror/state';
import { highlightActiveLine } from '@codemirror/view';
import { Decoration, DecorationSet } from '@codemirror/view';

export interface CodeEditorRef {
  highlightLine: (lineNumber: number) => void;
  clearHighlight: () => void;
}

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

// Create a custom extension for line highlighting
const createLineHighlightExtension = (lineNumber: number) => {
  const highlightLine = Decoration.line({
    attributes: { class: "bg-yellow-100" } // Tailwind class for subtle yellow highlight
  });

  return EditorView.decorations.of((view) => {
    const decorations: any[] = []; // Use any[] instead of Range<Decoration>[]
    
    // Ensure lineNumber is valid
    if (lineNumber > 0 && lineNumber <= view.state.doc.lines) {
      const line = view.state.doc.line(lineNumber);
      decorations.push(highlightLine.range(line.from));
    }
    
    return Decoration.set(decorations);
  });
};

type CodeEditorProps = {
  className?: string;
  readOnly?: boolean;
};

// Convert to forwardRef to expose the ref interface
const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({ className = '', readOnly = false }, ref) => {
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
  const [localHighlightedText, setLocalHighlightedText] = useState<string>('');
  const [highlightedLineNumber, setHighlightedLineNumber] = useState<number | null>(null);
  const [customExtensions, setCustomExtensions] = useState<Extension[]>([]);
  
  // Function to highlight a specific line by line number
  const highlightLineByNumber = (lineNumber: number) => {
    console.log("Highlighting line:", lineNumber);
    setHighlightedLineNumber(lineNumber);
    
    // Optionally, also scroll to this line
    if (editorViewRef.current) {
      const state = editorViewRef.current.state;
      if (lineNumber > 0 && lineNumber <= state.doc.lines) {
        const line = state.doc.line(lineNumber);
        
        // Create a selection at the start of the line
        const selection = { anchor: line.from, head: line.from };
        
        // Dispatch a transaction to update selection and scroll to it
        editorViewRef.current.dispatch({
          selection,
          scrollIntoView: true
        });
      }
    }
  };
  
  // Function to clear the highlighted line
  const clearHighlightedLine = () => {
    console.log("Clearing highlighted line");
    setHighlightedLineNumber(null);
  };
  
  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    highlightLine: highlightLineByNumber,
    clearHighlight: clearHighlightedLine
  }));
  
  // Debug logging for initial values
  useEffect(() => {
    console.log("Initial values from FileContext:", {
      highlightedText,
      updateHighlightedText: typeof updateHighlightedText === 'function',
    });
  }, []);
  
  useEffect(() => {
    console.log("CodeEditor state:", {
      userCodeLength: userCode?.length || 0,
      fileContentLength: fileContent?.length || 0,
      cachedContentLength: cachedFileContent?.length || 0,
      highlightedText,
      localHighlightedText,
      highlightedLineNumber,
    });
  }, [userCode, fileContent, cachedFileContent, highlightedText, localHighlightedText, highlightedLineNumber]);

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

  // Update custom extensions when highlighted line changes
  useEffect(() => {
    const extensions: Extension[] = [];
    
    if (highlightedLineNumber !== null) {
      extensions.push(createLineHighlightExtension(highlightedLineNumber));
    }
    
    setCustomExtensions(extensions);
    
    // If editor view exists, force a refresh to show the highlight
    if (editorViewRef.current) {
      setTimeout(() => {
        // Just dispatch a minimal transaction to force redraw
        editorViewRef.current?.dispatch({
          changes: { from: 0, to: 0, insert: "" }
        });
      }, 100);
    }
  }, [highlightedLineNumber]);

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

  // Handle updates from CodeMirror including selection changes
  const handleEditorUpdate = (viewUpdate: ViewUpdate): void => {
    // Store the editor view reference
    editorViewRef.current = viewUpdate.view;
    
    // Check if this update includes selection changes
    if (viewUpdate.selectionSet) {
      const selection = viewUpdate.state.selection.main;
      handleSelectionChange(selection);
    }
  };
  
  // Handle selection changes, both from mouse and keyboard
  const handleSelectionChange = (selection: SelectionRange): void => {
    if (selection.from !== selection.to) {
      // There is a selection
      const selectedText = editorViewRef.current?.state.sliceDoc(selection.from, selection.to) || '';
      
      console.log("Selection changed:", {
        from: selection.from,
        to: selection.to,
        text: selectedText
      });
      
      // Update local state
      setLocalHighlightedText(selectedText);
      
      // Update file context
      if (typeof updateHighlightedText === 'function') {
        console.log("Calling updateHighlightedText with:", selectedText);
        updateHighlightedText(selectedText);
      } else {
        console.error("updateHighlightedText is not a function!");
      }
    } else {
      // No selection
      console.log("Selection cleared");
      setLocalHighlightedText('');
      
      if (typeof updateHighlightedText === 'function') {
        updateHighlightedText('');
      }
    }
  };

  // Add this effect to monitor highlightedText changes from context
  useEffect(() => {
    console.log("Highlighted text in context changed to:", highlightedText);
  }, [highlightedText]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <ScrollArea className="flex-1">
        <CodeMirror
          value={userCode}
          height="540px"
          theme={vscodeLight}
          extensions={[python(), ...customExtensions]}
          onChange={handleCodeChange}
          onUpdate={handleEditorUpdate}
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
});

// Add a display name for better debugging
CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;