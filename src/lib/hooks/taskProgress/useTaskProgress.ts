'use client'

import { useState, useEffect } from 'react'
import { getTaskProgressForSession } from '@/lib/actions/task-progress-actions'
import { useSession } from '@/lib/context/session/SessionProvider'

export const useTaskProgress = (sessionId: string | undefined) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { taskCompletionTrigger } = useSession()

  const loadTaskProgress = async () => {
    if (!sessionId) {
      setCompletedTasks(new Set())
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getTaskProgressForSession(sessionId)
      
      if (result.success && result.data) {
        const completed = new Set(
          result.data.filter((p: any) => p.completed).map((p: any) => p.task_index)
        )
        setCompletedTasks(completed)
        console.log('✅ Loaded task progress:', Array.from(completed))
      } else {
        setError(result.error || 'Failed to load task progress')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Error loading task progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load initially
  useEffect(() => {
    loadTaskProgress()
  }, [sessionId])

  useEffect(() => {
    if (taskCompletionTrigger > 0) {
      console.log('🔄 Task completion detected, refreshing progress...')
      loadTaskProgress()
    }
  }, [taskCompletionTrigger])

  const isTaskCompleted = (taskIndex: number): boolean => {
    return completedTasks.has(taskIndex)
  }

  const refreshTaskProgress = async (): Promise<void> => {
    await loadTaskProgress()
  }

  return {
    completedTasks,
    isTaskCompleted,
    isLoading,
    error,
    refreshTaskProgress
  }
}