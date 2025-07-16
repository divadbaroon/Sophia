'use client'

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import { ViewUpdate } from '@uiw/react-codemirror';
import { SelectionRange, Extension, Range } from '@codemirror/state';
import { Decoration } from '@codemirror/view';
import { indentUnit } from '@codemirror/language';
import { saveCodeSnapshot } from '@/lib/actions/code-snapshot-actions';

import { useSession } from '@/lib/context/session/SessionProvider';
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider';

import { CodeEditorRef, CodeEditorProps } from "@/types"
import { DEFAULT_FONT_SIZE } from "@/lib/constants/code-editor-font"

// Local storage keys for zoom level
const LOCAL_STORAGE_ZOOM_KEY = 'code_editor_zoom_level';

// Generate template for only the current active method
const generateCurrentMethodTemplate = (methodsCode: Record<string, string>, activeMethodId: string): string => {
  if (!activeMethodId || !methodsCode[activeMethodId]) {
    return '';
  }
  
  return methodsCode[activeMethodId].trim();
};

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

// Convert to forwardRef to expose the ref interface
const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({ className = '', readOnly = false }, ref) => {
  const { 
    sessionId,
    activeMethodId,
    lessonId,
    currentMethodIndex,
  } = useSession();

  const {
    updateCachedFileContent, 
    setFileContent, 
    updateHighlightedText,
    methodsCode,       
    updateMethodsCode,
  } = useCodeEditor();

  const editorViewRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [localHighlightedText, setLocalHighlightedText] = useState<string>('');
  const [highlightedLineNumber, setHighlightedLineNumber] = useState<number | null>();
  const [fontSize, setFontSize] = useState<number>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to highlight a specific line by line number
  const highlightLineByNumber = useCallback((lineNumber: number) => {
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
  }, []);
  
  // Function to clear the highlighted line
  const clearHighlightedLine = useCallback(() => {
    console.log("Clearing highlighted line");
    setHighlightedLineNumber(null);
  }, []);

  // Add zoom functions
  const zoomIn = useCallback(() => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 1, 30); // Cap at 30px
      localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(newSize));
      return newSize;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 1, 8); // Don't go below 8px
      localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(newSize));
      return newSize;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE);
    localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(DEFAULT_FONT_SIZE));
  }, []);

  // Save current method to database
  const saveCurrentMethod = useCallback(async () => {
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
  }, [activeMethodId, sessionId, lessonId, currentMethodIndex]);

  // Manual save function (exposed via ref)
  const manualSave = useCallback(async () => {
    if (activeMethodId && editorViewRef.current) {
      const currentCode = editorViewRef.current.state.doc.toString();
      updateMethodsCode(activeMethodId, currentCode);
    }
    await saveCurrentMethod();
  }, [activeMethodId, updateMethodsCode, saveCurrentMethod]);
  
  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    highlightLine: highlightLineByNumber,
    clearHighlight: clearHighlightedLine, 
    zoomIn,
    zoomOut,
    resetZoom,
    saveCode: manualSave,
  }), [highlightLineByNumber, clearHighlightedLine, zoomIn, zoomOut, resetZoom, manualSave]);

  // Memoize custom extensions
  const customExtensions = useMemo(() => {
    const extensions: Extension[] = [
      // Add font size extension
      createFontSizeExtension(fontSize),
      // Set indentation to 4 spaces for Python
      indentUnit.of("    ")
    ];
    
    if (highlightedLineNumber !== null && highlightedLineNumber !== undefined) {
      extensions.push(createLineHighlightExtension(highlightedLineNumber));
    }
    
    return extensions;
  }, [highlightedLineNumber, fontSize]);

  // Handle updates from CodeMirror including selection changes
  const handleEditorUpdate = useCallback((viewUpdate: ViewUpdate): void => {
    // Only store the editor view reference if it has actually changed
    if (viewUpdate.view !== editorViewRef.current) {
      editorViewRef.current = viewUpdate.view;
    }
    
    // Check if this update includes selection changes
    if (viewUpdate.selectionSet) {
      const selection = viewUpdate.state.selection.main;
      handleSelectionChange(selection);
    }
  }, []);
  
  const handleSelectionChange = useCallback((selection: SelectionRange): void => {
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
  }, [localHighlightedText, updateHighlightedText]);

  const handleCodeChange = useCallback((value: string): void => {
    console.log('Code change for method:', activeMethodId, 'value length:', value.length);
    
    // Update fileContent immediately for the editor
    setFileContent(value); 
    
    // Use context function instead of local state
    if (activeMethodId) {
      updateMethodsCode(activeMethodId, value);
    }
    
    // Update cached content immediately
    updateCachedFileContent(value);

    // Debounced auto-save to database
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
  }, [activeMethodId, sessionId, lessonId, currentMethodIndex, setFileContent, updateMethodsCode, updateCachedFileContent]);

  // Add keyboard event listener for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S (or Cmd+S on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        manualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [manualSave]);

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
  }, [zoomIn, zoomOut]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Use context methodsCode instead of local state and isInitialized
  const currentMethodCode = activeMethodId && methodsCode[activeMethodId] ? 
    generateCurrentMethodTemplate(methodsCode, activeMethodId) : '';

  // Debug logging
  useEffect(() => {
    console.log('CodeEditor Debug:', {
      sessionId,
      activeMethodId,
      methodsCodeKeys: Object.keys(methodsCode),
      currentMethodCode: currentMethodCode?.substring(0, 50) + '...',
      hasMethodCode: !!methodsCode[activeMethodId]
    });
  }, [sessionId, activeMethodId, methodsCode, currentMethodCode]);

  return (
    <div 
      className={`h-full flex flex-col relative ${className}`}
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