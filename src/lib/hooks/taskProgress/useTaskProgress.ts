'use client'

import { useState, useEffect } from 'react'
import { getTaskProgressForSession } from '@/lib/actions/task-progress-actions'

import { UseTaskProgressReturn } from './types'

export const useTaskProgress = (sessionId: string | undefined): UseTaskProgressReturn => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        console.log('Loaded task progress:', Array.from(completed))
      } else {
        setError(result.error || 'Failed to load task progress')
        console.error('Failed to load task progress:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error loading task progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load task progress when sessionId changes
  useEffect(() => {
    loadTaskProgress()
  }, [sessionId])

  // Helper function to check if specific task is completed
  const isTaskCompleted = (taskIndex: number): boolean => {
    return completedTasks.has(taskIndex)
  }

  // Function to manually refresh task progress
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