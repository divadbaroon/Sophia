'use client'

import { useEffect } from 'react'
import { completeLessonProgress } from '@/lib/actions/learning-session-actions'
import { saveCodeSnapshot } from '@/lib/actions/code-snapshot-actions'

import { UseSessionEndTrackingProps } from "./types"

export const useSessionEndTracking = ({
  sessionId,
  lessonId, 
  activeMethodId,
  currentMethodIndex,
  fileContent
}: UseSessionEndTrackingProps) => {

  useEffect(() => {
    if (!sessionId || !lessonId) return

    const handleBeforeUnload = () => {
      console.log('🚪 User leaving session - saving final state...')
      
      // Save final code state 
      if (activeMethodId && currentMethodIndex !== undefined && fileContent.trim()) {
        saveCodeSnapshot({
          sessionId,
          lessonId,
          taskIndex: currentMethodIndex,
          methodId: activeMethodId,
          codeContent: fileContent
        }).then(() => {
          console.log('✅ Final code snapshot saved')
        }).catch(error => {
          console.error('❌ Failed to save final code snapshot:', error)
        })
      }

      // Mark session as completed using sessionId instead of lessonId
      completeLessonProgress(sessionId).then(() => {
        console.log('✅ Session marked as completed on exit')
      }).catch(error => {
        console.error('❌ Failed to complete session on exit:', error)
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('📱 Page hidden - saving state...')
        
        // Save current state when page becomes hidden
        if (activeMethodId && currentMethodIndex !== undefined && fileContent.trim()) {
          saveCodeSnapshot({
            sessionId,
            lessonId,
            taskIndex: currentMethodIndex,
            methodId: activeMethodId,
            codeContent: fileContent
          }).catch(error => {
            console.error('❌ Failed to save on visibility change:', error)
          })
        }
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [sessionId, lessonId, activeMethodId, currentMethodIndex, fileContent])
}

export default useSessionEndTracking