'use client'

import { useRef, useEffect, useCallback } from 'react'
import { saveCodeSnapshot } from '@/lib/actions/code-snapshot-actions'

import { UseAutoSaveProps } from './types'

export const useAutoSave = ({ 
  activeMethodId, 
  sessionId, 
  lessonId, 
  currentMethodIndex 
}: UseAutoSaveProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scheduleAutoSave = useCallback((code: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      if (activeMethodId && sessionId && lessonId && currentMethodIndex !== undefined) {
        saveCodeSnapshot({
          sessionId,
          lessonId,
          taskIndex: currentMethodIndex,
          methodId: activeMethodId,
          codeContent: code
        }).catch(error => {
          console.error("Auto-save failed:", error)
        })
      }
    }, 3000) // Save after 3 seconds of idle time
  }, [activeMethodId, sessionId, lessonId, currentMethodIndex])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    scheduleAutoSave
  }
}