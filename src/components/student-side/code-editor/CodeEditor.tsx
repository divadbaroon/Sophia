'use client'

import React, { useRef, useCallback, useMemo, useEffect } from 'react';

import CodeMirror from '@uiw/react-codemirror';

import { java } from '@codemirror/lang-java';
import { indentUnit } from '@codemirror/language';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view' 
import { StateField, StateEffect } from '@codemirror/state';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { ViewUpdate } from '@uiw/react-codemirror';

import { useSession } from '@/lib/context/session/SessionProvider';
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider';

import { useTextSelection } from '@/lib/hooks/codeEditor/useTextSelection';
import { useAutoSave } from '@/lib/hooks/codeEditor/useAutoSave';
import { useEditorShortcuts } from '@/lib/hooks/codeEditor/useEditorShortcuts';
import { useEditorZoom } from '@/lib/hooks/codeEditor/useEditorZoom';
import { useManualSave } from '@/lib/hooks/codeEditor/useManualSave';

import { generateCurrentMethodTemplate, createFontSizeExtension } from '@/utils/code-editor/code-editor-utils';

import { CodeEditorProps } from "@/types"

interface ExtendedCodeEditorProps extends CodeEditorProps {
  terminalHeight?: number;
}

// Create highlight decoration with light yellow
const highlightMark = Decoration.line({
  attributes: { style: "background-color: #fff9c4; animation: highlightPersist 5s forwards;" }
});

// State effect to add highlight
const addHighlight = StateEffect.define<number>();

// State field to manage highlights
const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    highlights = highlights.map(tr.changes);
    
    for (let effect of tr.effects) {
      if (effect.is(addHighlight)) {
        const line = tr.state.doc.line(effect.value);
        highlights = highlights.update({
          add: [highlightMark.range(line.from, line.from)]
        });
      }
    }
    
    return highlights;
  },
  provide: f => EditorView.decorations.from(f)
});

const CodeEditor = ({ 
  className = '', 
  readOnly = false, 
  terminalHeight = 50 
}: ExtendedCodeEditorProps) => {
  const { sessionId, activeMethodId } = useSession();
  const { 
    updateCachedFileContent, 
    setFileContent, 
    methodsCode, 
    updateMethodsCode,
    systemHighlightedLine,
    updateSystemHighlightedLine
  } = useCodeEditor();

  const editorViewRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // Custom hooks
  const { handleSelectionChange } = useTextSelection();
  const { scheduleAutoSave } = useAutoSave({ 
    activeMethodId, 
    sessionId, 
    lessonId: useSession().lessonId, 
    currentMethodIndex: useSession().currentMethodIndex 
  });
  const { fontSize } = useEditorZoom(editorContainerRef);
  const { manualSave } = useManualSave(editorViewRef);

  // Use shortcuts hook
  useEditorShortcuts(manualSave);

  // Watch for system highlight changes
  useEffect(() => {
    if (systemHighlightedLine && editorViewRef.current) {
      console.log("🔆 Highlighting line:", systemHighlightedLine);
      
      // Add highlight to the line
      editorViewRef.current.dispatch({
        effects: addHighlight.of(systemHighlightedLine)
      });
      
      // Clear the highlight after 5 seconds
      setTimeout(() => {
        console.log("🔆 Clearing highlight for line:", systemHighlightedLine);
        updateSystemHighlightedLine(null);
      }, 5000);
    }
  }, [systemHighlightedLine, updateSystemHighlightedLine]);

  // Memoize custom extensions
  const customExtensions = useMemo(() => [
    java(),
    createFontSizeExtension(fontSize),
    indentUnit.of("    "),
    highlightField
  ], [fontSize]);

  // Handle updates from CodeMirror including selection changes
  const handleEditorUpdate = useCallback((viewUpdate: ViewUpdate): void => {
    if (viewUpdate.view !== editorViewRef.current) {
      editorViewRef.current = viewUpdate.view;
    }
    
    if (viewUpdate.selectionSet) {
      const selection = viewUpdate.state.selection.main;
      handleSelectionChange(selection, editorViewRef.current);
    }
  }, [handleSelectionChange]);

  const handleCodeChange = useCallback((value: string): void => {    
    setFileContent(value); 
    
    if (activeMethodId) {
      updateMethodsCode(activeMethodId, value);
    }
    
    updateCachedFileContent(value);
    scheduleAutoSave(value);
  }, [activeMethodId, setFileContent, updateMethodsCode, updateCachedFileContent, scheduleAutoSave]);

  // Use utility function
  const currentMethodCode = generateCurrentMethodTemplate(methodsCode, activeMethodId);

  return (
    <>
      <style jsx global>{`
        .cm-editor,
        .cm-editor.cm-focused {
          border-top: none !important;
          outline: none !important;
          border: none !important;
        }
        
        .cm-editor .cm-scroller {
          border-top: none !important;
          /* 🎯 Dynamic padding based on terminal height */
          padding-bottom: ${terminalHeight}vh !important;
        }
        
        .cm-content {
          border-top: none !important;
          /* 🎯 Dynamic padding based on terminal height */
          padding-bottom: ${terminalHeight}vh !important;
        }

        /* Highlight animation - persist for 5 seconds then fade */
        @keyframes highlightPersist {
          0% { background-color: #fff9c4; }
          80% { background-color: #fff9c4; }
          100% { background-color: transparent; }
        }
      `}</style>
      
      <div 
        className={`h-full flex flex-col relative ${className}`}
        ref={editorContainerRef}
      >
        <CodeMirror
          key={`${sessionId}-${activeMethodId}`}
          value={currentMethodCode}
          height="640px"
          theme={vscodeLight}
          extensions={customExtensions}
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
      </div>
    </>
  );
}

export default CodeEditor;