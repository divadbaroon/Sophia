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
import { saveCodeSnapshot, loadAllCodeSnapshots } from '@/lib/actions/code-snapshot-actions';

export interface CodeEditorRef {
  highlightLine: (lineNumber: number) => void;
  clearHighlight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  saveCode: () => Promise<void>;
}

// Generate template for only the current active method
const generateCurrentMethodTemplate = (methodsCode: Record<string, string>, activeMethodId: string): string => {
  if (!activeMethodId || !methodsCode[activeMethodId]) {
    return '';
  }
  
  return methodsCode[activeMethodId].trim();
};

// Local storage keys for zoom level only
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
    updateCachedFileContent, 
    setFileContent, 
    updateHighlightedText,
    updateExecutionOutput,
    setErrorContent,
    sessionId,
    sessionData,
    activeMethodId,
    lessonId,
    currentMethodIndex,
  } = useFile();
  
  const editorViewRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [methodsCode, setMethodsCode] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [localHighlightedText, setLocalHighlightedText] = useState<string>('');
  const [highlightedLineNumber, setHighlightedLineNumber] = useState<number | null>();
  const [customExtensions, setCustomExtensions] = useState<Extension[]>([]);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Add keyboard event listener for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S (or Cmd+S on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        
        // Get current code directly from editor and save
        if (editorViewRef.current && activeMethodId && sessionId && lessonId && currentMethodIndex !== undefined) {
          const currentCode = editorViewRef.current.state.doc.toString();
          
          // Update state immediately
          setMethodsCode(prev => ({
            ...prev,
            [activeMethodId]: currentCode
          }));
          
          // Save to database
          saveCodeSnapshot({
            sessionId,
            lessonId,
            taskIndex: currentMethodIndex,
            methodId: activeMethodId,
            codeContent: currentCode
          }).then(() => {
            console.log(`✅ Manual save completed for ${activeMethodId}`);
          }).catch(error => {
            console.error(`❌ Manual save failed for ${activeMethodId}:`, error);
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeMethodId, sessionId, lessonId, currentMethodIndex]);

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

  // Save current method to database
  const saveCurrentMethod = async () => {
    if (!activeMethodId || !sessionId || !lessonId || currentMethodIndex === undefined) {
      return;
    }

    // Get the current code content from the editor view
    const currentCode = editorViewRef.current?.state.doc.toString() || '';
    
    try {
      await saveCodeSnapshot({
        sessionId,
        lessonId,
        taskIndex: currentMethodIndex,
        methodId: activeMethodId,
        codeContent: currentCode  
      });
      console.log(`✅ Saved code for method: ${activeMethodId}`);
    } catch (error) {
      console.error(`❌ Failed to save code for method ${activeMethodId}:`, error);
    } 
  };

  // Manual save function (exposed via ref)
  const manualSave = async () => {
    // update methodsCode state to keep it in sync
    if (activeMethodId && editorViewRef.current) {
      const currentCode = editorViewRef.current.state.doc.toString();
      setMethodsCode(prev => ({
        ...prev,
        [activeMethodId]: currentCode
      }));
    }
    await saveCurrentMethod();
  };
  
  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    highlightLine: highlightLineByNumber,
    clearHighlight: clearHighlightedLine, 
    zoomIn,
    zoomOut,
    resetZoom,
    saveCode: manualSave
  }), [])
  
  // Load saved code from database or initialize with templates
  useEffect(() => {
    if (isInitialized || !sessionData || !sessionData.methodTemplates || !sessionId || !lessonId) return;
    
    console.log("CodeEditor initializing with templates for session", sessionId);
    
    const initializeCode = async () => {
      // Start with templates as fallback
      const initialMethodsCode = { ...sessionData.methodTemplates };
      
      try {
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
      } catch (error) {
        console.error("Error loading saved code:", error);
        console.log("Falling back to templates");
      }

      // Load saved zoom level from localStorage
      try {
        const savedZoom = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (savedZoom) {
          const parsedZoom = parseInt(savedZoom, 10);
          if (!isNaN(parsedZoom)) {
            setFontSize(parsedZoom);
          }
        }
      } catch (err) {
        console.error("Error loading zoom level:", err);
      }
      
      // Set methodsCode first
      setMethodsCode(initialMethodsCode);
      
      // Generate and set initial content (only current method)
      const initialCurrentMethodCode = generateCurrentMethodTemplate(initialMethodsCode, activeMethodId);
      setFileContent(initialCurrentMethodCode);
      updateCachedFileContent(initialCurrentMethodCode);
      
      // Clear any previous results
      updateExecutionOutput('');
      setErrorContent('');
      
      console.log("CodeEditor initialized with current method for session", sessionId);
      setIsInitialized(true);
    };

    initializeCode();
  }, [sessionData, sessionId, lessonId, isInitialized, activeMethodId, updateCachedFileContent, setFileContent, updateExecutionOutput, setErrorContent]);

  // Reset initialization when session changes
  useEffect(() => {
    setIsInitialized(false);
  }, [sessionId]);

  // Save code when switching methods
  useEffect(() => {
    if (!isInitialized || !activeMethodId || !methodsCode[activeMethodId]) return;
    
    // Save previous method before switching (if there was a previous method)
    const methodIds = Object.keys(methodsCode);
    const currentIndex = methodIds.indexOf(activeMethodId);
    if (currentIndex > 0) {
      const previousMethodId = methodIds[currentIndex - 1];
      if (methodsCode[previousMethodId]) {
        saveCodeSnapshot({
          sessionId: sessionId || '',
          lessonId: lessonId || '',
          taskIndex: currentMethodIndex,
          methodId: previousMethodId,
          codeContent: methodsCode[previousMethodId]
        }).catch(console.error);
      }
    }
    
    const currentMethodCode = generateCurrentMethodTemplate(methodsCode, activeMethodId);
    setFileContent(currentMethodCode);
    updateCachedFileContent(currentMethodCode);
    
    console.log("Switched to method:", activeMethodId);
  }, [activeMethodId, isInitialized, methodsCode, setFileContent, updateCachedFileContent, sessionId, lessonId, currentMethodIndex]);

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
    // 1. Update fileContent immediately for the editor
    setFileContent(value); 
    
    // 2. Update methodsCode immediately for local consistency
    if (activeMethodId) {
      setMethodsCode(prevMethodsCode => ({
        ...prevMethodsCode,
        [activeMethodId]: value
      }));
    }
    
    // 3. Update cached content immediately
    updateCachedFileContent(value);

    // 4. Debounced auto-save to database
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (activeMethodId && sessionId && lessonId && currentMethodIndex !== undefined) {
        saveCodeSnapshot({
          sessionId,
          lessonId,
          taskIndex: currentMethodIndex,
          methodId: activeMethodId,
          codeContent: value
        }).catch(error => {
          console.error("Auto-save failed:", error);
        });
      }
    }, 3000); // Save after 3 seconds of idle time
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Generate the current method code for the editor
  const currentMethodCode = isInitialized && activeMethodId ? 
    generateCurrentMethodTemplate(methodsCode, activeMethodId) : '';

  return (
    <div 
      className={`h-full flex flex-col ${className}`}
      ref={editorContainerRef}
    >
      
      <ScrollArea className="flex-1">
        <CodeMirror
          key={`${sessionId}-${activeMethodId}`} // Force re-render when session or method changes
          value={currentMethodCode}
          height="640px"
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