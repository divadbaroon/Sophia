'use client'

import { useState, useEffect } from 'react'
import { getTaskProgressForSession } from '@/lib/actions/task-progress-actions'

export const useTaskProgressLoader = (sessionId: string | undefined) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set())
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)

  useEffect(() => {
    const loadTaskProgress = async () => {
      if (!sessionId) {
        setCompletedTasks(new Set())
        return
      }

      setIsLoadingProgress(true)
      
      try {
        console.log('📊 Loading task progress for session:', sessionId)
        const result = await getTaskProgressForSession(sessionId)
        
        if (result.success && result.data) {
          const completed = new Set(
            result.data.filter((p: any) => p.completed).map((p: any) => p.task_index)
          )
          setCompletedTasks(completed)
          console.log('✅ Loaded completed tasks:', Array.from(completed))
        } else {
          console.log('📝 No previous progress found, starting fresh')
          setCompletedTasks(new Set())
        }
      } catch (error) {
        console.error('❌ Error loading task progress:', error)
        setCompletedTasks(new Set()) // Start fresh on error
      } finally {
        setIsLoadingProgress(false)
      }
    }

    loadTaskProgress()
  }, [sessionId])

  // Optimistic update function
  const markTaskCompleted = (taskIndex: number) => {
    console.log(`✅ Marking task ${taskIndex} as completed (optimistic)`)
    setCompletedTasks((prev: Set<number>) => {
      const newSet = new Set(prev)
      newSet.add(taskIndex)
      return newSet
    })
  }

  return {
    completedTasks,
    isLoadingProgress,
    markTaskCompleted
  }
}