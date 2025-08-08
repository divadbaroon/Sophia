'use client'

import { useState, useCallback } from 'react'
import { SelectionRange } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider'

export const useTextSelection = () => {
  const [localHighlightedText, setLocalHighlightedText] = useState<string>('')
  const { updateHighlightedText } = useCodeEditor()

  const handleSelectionChange = useCallback((selection: SelectionRange, editorView: EditorView | null) => {
    // Prevent unnecessary state updates if selection hasn't meaningfully changed
    if (selection.from !== selection.to) {
      // There is a selection
      const selectedText = editorView?.state.sliceDoc(selection.from, selection.to) || ''
      
      // Only update if the selected text is different from the current selection
      if (selectedText !== localHighlightedText) {
        // Update local state
        setLocalHighlightedText(selectedText)
        
        // Update file context
        if (typeof updateHighlightedText === 'function') {
          updateHighlightedText(selectedText)
        }
      }
    } else if (localHighlightedText !== '') {
      // Clear selection if it was previously set
      setLocalHighlightedText('')
      
      if (typeof updateHighlightedText === 'function') {
        updateHighlightedText('')
      }
    }
  }, [localHighlightedText, updateHighlightedText])

  return {
    localHighlightedText,
    handleSelectionChange
  }
}