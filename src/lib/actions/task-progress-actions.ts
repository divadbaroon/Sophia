"use server"

import { createClient } from "@/utils/supabase/server"

// Update or create task progress
export async function updateTaskProgress(
  sessionId: string, 
  taskIndex: number, 
  isCompleted: boolean,
  testCasesPassed?: number,
  totalTestCases?: number
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Increment attempts when updating
    const { data: currentProgress } = await supabase
      .from('task_progress')
      .select('attempts')
      .eq('session_id', sessionId)
      .eq('task_index', taskIndex)
      .eq('profile_id', user.id)
      .single()

    const currentAttempts = currentProgress?.attempts || 0

    // Upsert task progress
    const { data, error } = await supabase
      .from('task_progress')
      .upsert({
        profile_id: user.id,
        session_id: sessionId,
        task_index: taskIndex,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        attempts: currentAttempts + 1,
        test_cases_passed: testCasesPassed || 0,
        total_test_cases: totalTestCases || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id,task_index'
      })
      .select()

    if (error) {
      console.error('Error updating task progress:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Task ${taskIndex} progress updated:`, { isCompleted, testCasesPassed, totalTestCases })
    return { success: true, data }

  } catch (error) {
    console.error('Error in updateTaskProgress:', error)
    return { success: false, error: "Failed to update task progress" }
  }
}

// Get all task progress for a specific session
export async function getTaskProgressForSession(sessionId?: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    let query = supabase
      .from('task_progress')
      .select('*')
      .eq('profile_id', user.id)

    // If sessionId provided, filter by it
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query.order('task_index', { ascending: true })

    if (error) {
      console.error('Error fetching task progress:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getTaskProgressForSession:', error)
    return { success: false, error: "Failed to fetch task progress" }
  }
}

// Get progress for a specific task
export async function getTaskProgress(sessionId: string, taskIndex: number) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('task_progress')
      .select('*')
      .eq('session_id', sessionId)
      .eq('task_index', taskIndex)
      .eq('profile_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching specific task progress:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || null }
  } catch (error) {
    console.error('Error in getTaskProgress:', error)
    return { success: false, error: "Failed to fetch task progress" }
  }
}

// Mark task as completed (convenience function)
export async function markTaskCompleted(
  sessionId: string, 
  taskIndex: number,
  testCasesPassed?: number,
  totalTestCases?: number
) {
  return updateTaskProgress(sessionId, taskIndex, true, testCasesPassed, totalTestCases)
}

// Record a task attempt (when user runs code but doesn't pass all tests)
export async function recordTaskAttempt(
  sessionId: string, 
  taskIndex: number,
  testCasesPassed: number,
  totalTestCases: number
) {
  return updateTaskProgress(sessionId, taskIndex, false, testCasesPassed, totalTestCases)
}

// Get task completion statistics for a session
export async function getSessionTaskStats(sessionId: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('task_progress')
      .select('task_index, completed, attempts, test_cases_passed, total_test_cases')
      .eq('session_id', sessionId)
      .eq('profile_id', user.id)
      .order('task_index', { ascending: true })

    if (error) {
      console.error('Error fetching session task stats:', error)
      return { success: false, error: error.message }
    }

    // Calculate statistics
    const completedTasks = data?.filter(task => task.completed).length || 0
    const totalTasks = data?.length || 0
    const totalAttempts = data?.reduce((sum, task) => sum + (task.attempts || 0), 0) || 0
    const averageTestCasesPassed = data?.length 
      ? data.reduce((sum, task) => sum + (task.test_cases_passed || 0), 0) / data.length 
      : 0

    return { 
      success: true, 
      data: {
        completedTasks,
        totalTasks,
        totalAttempts,
        averageTestCasesPassed,
        taskProgress: data
      }
    }
  } catch (error) {
    console.error('Error in getSessionTaskStats:', error)
    return { success: false, error: "Failed to fetch session task statistics" }
  }
}

// Reset task progress (useful for allowing retries)
export async function resetTaskProgress(sessionId: string, taskIndex: number) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('task_progress')
      .update({
        completed: false,
        completed_at: null,
        test_cases_passed: 0,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('task_index', taskIndex)
      .eq('profile_id', user.id)
      .select()

    if (error) {
      console.error('Error resetting task progress:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in resetTaskProgress:', error)
    return { success: false, error: "Failed to reset task progress" }
  }
}

// Delete task progress (cleanup)
export async function deleteTaskProgress(sessionId: string, taskIndex?: number) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    let query = supabase
      .from('task_progress')
      .delete()
      .eq('session_id', sessionId)
      .eq('profile_id', user.id)

    // If taskIndex provided, only delete that specific task
    if (taskIndex !== undefined) {
      query = query.eq('task_index', taskIndex)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting task progress:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteTaskProgress:', error)
    return { success: false, error: "Failed to delete task progress" }
  }
}