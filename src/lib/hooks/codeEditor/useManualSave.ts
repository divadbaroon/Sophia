'use client'

import { useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { saveCodeSnapshot } from '@/lib/actions/code-snapshot-actions'
import { useSession } from '@/lib/context/session/SessionProvider'
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider'

export const useManualSave = (editorViewRef: React.RefObject<EditorView | null>) => {
  const { sessionId, activeMethodId, lessonId, currentMethodIndex } = useSession()
  const { updateMethodsCode } = useCodeEditor()

  // Save current method to database
  const saveCurrentMethod = useCallback(async () => {
    if (!activeMethodId || !sessionId || !lessonId || currentMethodIndex === undefined) {
      return
    }

    const currentCode = editorViewRef.current?.state.doc.toString() || ''
    
    try {
      await saveCodeSnapshot({
        sessionId,
        lessonId,
        taskIndex: currentMethodIndex,
        methodId: activeMethodId,
        codeContent: currentCode  
      })
      console.log(`Saved code for method: ${activeMethodId}`)
    } catch (error) {
      console.error(`Failed to save code for method ${activeMethodId}:`, error)
    } 
  }, [activeMethodId, sessionId, lessonId, currentMethodIndex, editorViewRef])

  // Manual save function 
  const manualSave = useCallback(async () => {
    if (activeMethodId && editorViewRef.current) {
      const currentCode = editorViewRef.current.state.doc.toString()
      updateMethodsCode(activeMethodId, currentCode)
    }
    await saveCurrentMethod()
  }, [activeMethodId, updateMethodsCode, saveCurrentMethod, editorViewRef])

  return {
    saveCurrentMethod,
    manualSave
  }
}