'use client'

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { useFile } from '@/lib/context/FileContext';
import { EditorView } from '@codemirror/view';
import { ViewUpdate } from '@uiw/react-codemirror';
import { SelectionRange, Extension, Range } from '@codemirror/state';
import { Decoration } from '@codemirror/view';
import { indentUnit } from '@codemirror/language';

export interface CodeEditorRef {
  highlightLine: (lineNumber: number) => void;
  clearHighlight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const generateFullTemplate = (methodsCode: Record<string, string>): string => {
  // Convert all method code into a single string 
  const allMethodsCode = Object.values(methodsCode)
    .map(code => code.trim())
    .join('\n\n');

  return allMethodsCode;
};

// Local storage keys for saving code
const LOCAL_STORAGE_CODE_KEY_PREFIX = 'functions_code_'; 
const LOCAL_STORAGE_ZOOM_KEY = 'code_editor_zoom_level';

// Default base font size in pixels
const DEFAULT_FONT_SIZE = 14;

// Create a custom extension for line highlighting
const createLineHighlightExtension = (lineNumber: number) => {
  const highlightLine = Decoration.line({
    attributes: { class: "bg-yellow-100" } 
  });

  return EditorView.decorations.of((view) => {
    const decorations: Range<Decoration>[] = []; 
    
    // Ensure lineNumber is valid
    if (lineNumber > 0 && lineNumber <= view.state.doc.lines) {
      const line = view.state.doc.line(lineNumber);
      decorations.push(highlightLine.range(line.from));
    }
    
    return Decoration.set(decorations);
  });
};

// Create a custom extension for font size
const createFontSizeExtension = (fontSize: number) => {
  return EditorView.theme({
    "&": {
      fontSize: `${fontSize}px`
    }
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
    updateHighlightedText,
    updateExecutionOutput,
    setErrorContent,
    sessionId,
    sessionData,
    activeMethodId,
  } = useFile();
  
  const editorViewRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [methodsCode, setMethodsCode] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [localHighlightedText, setLocalHighlightedText] = useState<string>('');
  // Default to highlighting line 1 of the student's code when loaded
  const [highlightedLineNumber, setHighlightedLineNumber] = useState<number | null>();
  const [customExtensions, setCustomExtensions] = useState<Extension[]>([]);
  // Add zoom state
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  
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

  // Add zoom functions
  const zoomIn = () => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 1, 30); // Cap at 30px
      localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(newSize));
      return newSize;
    });
  };

  const zoomOut = () => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 1, 8); // Don't go below 8px
      localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(newSize));
      return newSize;
    });
  };

  const resetZoom = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(DEFAULT_FONT_SIZE));
  };
  
  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    highlightLine: highlightLineByNumber,
    clearHighlight: clearHighlightedLine,
    zoomIn,
    zoomOut,
    resetZoom
  }));
  
  // Load saved code from localStorage or initialize with templates
  useEffect(() => {
    if (isInitialized || !sessionData || !sessionData.methodTemplates) return;
    
    console.log("CodeEditor initializing with templates for session", sessionId);
    
    // Create a session-specific localStorage key
    const storageKey = `${LOCAL_STORAGE_CODE_KEY_PREFIX}${sessionId}`;
    
    // Try to load from localStorage first
    let initialMethodsCode = { ...sessionData.methodTemplates };
    
    if (typeof window !== 'undefined') {
      try {
        const savedCode = localStorage.getItem(storageKey);
        if (savedCode) {
          console.log("Found saved code in localStorage for session", sessionId);
          const parsedCode = JSON.parse(savedCode);
          
          // Verify the saved methods match the current session's methods
          const templateKeys = Object.keys(sessionData.methodTemplates);
          const savedKeys = Object.keys(parsedCode);
          
          const methodsMatch = templateKeys.length === savedKeys.length && 
                               templateKeys.every(key => savedKeys.includes(key));
                               
          if (methodsMatch) {
            console.log("Using saved code from localStorage");
            initialMethodsCode = parsedCode;
          } else {
            console.log("Saved code doesn't match current session templates, using defaults");
          }
        }

        // Load saved zoom level
        const savedZoom = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (savedZoom) {
          const parsedZoom = parseInt(savedZoom, 10);
          if (!isNaN(parsedZoom)) {
            setFontSize(parsedZoom);
          }
        }
      } catch (err) {
        console.error("Error accessing localStorage:", err);
      }
    }
    
    // Generate and set initial content (standalone functions)
    const initialFullCode = generateFullTemplate(initialMethodsCode);
    setMethodsCode(initialMethodsCode);
    setFileContent(initialFullCode);
    updateCachedFileContent(initialFullCode);
    
    // Clear any previous results
    updateExecutionOutput('');
    setErrorContent('');
    
    console.log("CodeEditor initialized with functions for session", sessionId);
    setIsInitialized(true);
  }, [sessionData, sessionId, isInitialized, updateCachedFileContent, setFileContent, updateExecutionOutput, setErrorContent]);

  // Reset initialization when session changes
  useEffect(() => {
    setIsInitialized(false);
  }, [sessionId]);

  // Extract user code from full template if fileContent changes externally
  useEffect(() => {
    if (!isInitialized || !fileContent || fileContent === cachedFileContent || !sessionData?.methodTemplates) return;
    
    // For each method, try to extract its code
    const updatedMethods = { ...methodsCode };
    let codeUpdated = false;
    
    const methodIds = Object.keys(sessionData.methodTemplates);
    for (const methodId of methodIds) {
      // Extract the function from the full code (now without class wrapper)
      const functionRegex = new RegExp(`(def\\s+${methodId}[\\s\\S]*?)(?=\\ndef\\s+|$)`, 'i');
      const match = fileContent.match(functionRegex);
      
      if (match && match[1]) {
        const extractedCode = match[1].trim();
        if (extractedCode !== updatedMethods[methodId]?.trim()) {
          updatedMethods[methodId] = extractedCode;
          codeUpdated = true;
        }
      }
    }
    
    if (codeUpdated) {
      console.log("Updated functions code from fileContent:", updatedMethods);
      setMethodsCode(updatedMethods);
    }
  }, [isInitialized, fileContent, cachedFileContent, methodsCode, sessionData]);

  // Update custom extensions when highlighted line or font size changes
  useEffect(() => {
    const extensions: Extension[] = [
      // Add font size extension
      createFontSizeExtension(fontSize),
      // Set indentation to 4 spaces for Python
      indentUnit.of("    ")
    ];
    
    if (highlightedLineNumber !== null) {
      extensions.push(createLineHighlightExtension(0));
    }
    
    setCustomExtensions(extensions);
    
    // If editor view exists, force a refresh to show the highlight and font size
    if (editorViewRef.current) {
      setTimeout(() => {
        // Just dispatch a minimal transaction to force redraw
        editorViewRef.current?.dispatch({
          changes: { from: 0, to: 0, insert: "" }
        });
      }, 100);
    }
  }, [highlightedLineNumber, fontSize]);

  // Add event listener for wheel events to handle zooming
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl key is pressed
      if (e.ctrlKey) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
          // Zoom in (wheel up)
          zoomIn();
        } else {
          // Zoom out (wheel down)
          zoomOut();
        }
      }
    };
    
    // Add the event listener to the editor container
    const container = editorContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    // Cleanup function
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

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

  // Save methods code to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized || !sessionId) return;
    
    try {
      // Use session-specific key
      const storageKey = `${LOCAL_STORAGE_CODE_KEY_PREFIX}${sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(methodsCode));
      console.log(`Saved functions code to localStorage for session ${sessionId}`);
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
  }, [isInitialized, methodsCode, sessionId]);

  // Scroll to current method when activeMethodId changes
  useEffect(() => {
    if (!activeMethodId || !editorViewRef.current) return;
    
    // Find the line number where the function starts
    const text = editorViewRef.current.state.doc.toString();
    const lines = text.split('\n');
    let lineNumber = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`def ${activeMethodId}`)) {
        lineNumber = i + 1;
        break;
      }
    }
    
    if (lineNumber > 0) {
      // Scroll to the function
      const line = editorViewRef.current.state.doc.line(lineNumber);
      editorViewRef.current.dispatch({
        selection: { anchor: line.from, head: line.from },
        scrollIntoView: true
      });
    }
  }, [activeMethodId]);

  // Handle updates from CodeMirror including selection changes
  const handleEditorUpdate = (viewUpdate: ViewUpdate): void => {
    // Only store the editor view reference if it has actually changed
    if (viewUpdate.view !== editorViewRef.current) {
      editorViewRef.current = viewUpdate.view;
    }
    
    // Check if this update includes selection changes
    if (viewUpdate.selectionSet) {
      const selection = viewUpdate.state.selection.main;
      handleSelectionChange(selection);
    }
  };
  
  const handleSelectionChange = (selection: SelectionRange): void => {
    // Prevent unnecessary state updates if selection hasn't meaningfully changed
    if (selection.from !== selection.to) {
      // There is a selection
      const selectedText = editorViewRef.current?.state.sliceDoc(selection.from, selection.to) || '';
      
      // Only update if the selected text is different from the current selection
      if (selectedText !== localHighlightedText) {
        // Update local state
        setLocalHighlightedText(selectedText);
        
        // Update file context
        if (typeof updateHighlightedText === 'function') {
          updateHighlightedText(selectedText);
        }
      }
    } else if (localHighlightedText !== '') {
      // Clear selection if it was previously set
      setLocalHighlightedText('');
      
      if (typeof updateHighlightedText === 'function') {
        updateHighlightedText('');
      }
    }
  };

  const handleCodeChange = (value: string): void => {
    setFileContent(value); 
  };

  // Generate the full code for the editor (standalone functions)
  const fullCode = isInitialized ? generateFullTemplate(methodsCode) : '';

  return (
    <div 
      className={`h-full flex flex-col ${className}`}
      ref={editorContainerRef}
    >
      {/* Add a small zoom control indicator */}
      <div className="absolute top-3 right-3 z-10 bg-white bg-opacity-75 rounded px-2 py-1 text-xs text-gray-600 flex items-center space-x-2">
        <button 
          onClick={zoomOut}
          className="hover:text-blue-600 focus:outline-none"
        >
          −
        </button>
        <span>{fontSize}px</span>
        <button 
          onClick={zoomIn}
          className="hover:text-blue-600 focus:outline-none"
        >
          +
        </button>
        <button 
          onClick={resetZoom}
          className="ml-1 text-gray-500 hover:text-blue-600 text-[10px] focus:outline-none"
        >
          reset
        </button>
      </div>
      
      <ScrollArea className="flex-1">
        <CodeMirror
          key={sessionId} // Force re-render when session changes
          value={fullCode}
          height="680px"
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

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;