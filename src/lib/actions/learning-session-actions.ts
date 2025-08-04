"use server"

import { createClient } from "@/utils/supabase/server"

// Create a new learning session
export async function createLearningSession(lessonId: string, classId: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        profile_id: user.id,
        lesson_id: lessonId,
        class_id: classId,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating learning session:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createLearningSession:', error)
    return { success: false, error: "Failed to create learning session" }
  }
}

export async function completeLessonProgress(lessonId: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Find the most recent learning session for this lesson
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('profile_id', user.id)
      .eq('lesson_id', lessonId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !session) {
      console.error('Error finding learning session:', sessionError)
      return { success: false, error: "Learning session not found" }
    }

    // Update the learning session with completion data
    const { data, error } = await supabase
      .from('learning_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .eq('profile_id', user.id)
      .select()

    if (error) {
      console.error('Error completing lesson:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Lesson completed successfully:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Unexpected error completing lesson:', error)
    return { success: false, error: 'Failed to complete lesson' }
  }
}

// Update learning session status and timestamps
export async function updateLearningSession(
  sessionId: string, 
  updates: {
    status?: 'in_progress' | 'coding_tasks' | 'completed'
    completed_at?: string
    survey_completed_at?: string
  }
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from('learning_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only update their own sessions

    if (error) {
      console.error('Error updating learning session:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateLearningSession:', error)
    return { success: false, error: "Failed to update learning session" }
  }
}

// Get learning session by ID (for resuming or checking status)
export async function getLearningSession(sessionId: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('learning_sessions')
      .select(`
        *,
        lessons (
          id,
          title,
          description,
          difficulty
        ),
        classes (
          id,
          class_code,
          class_name
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching learning session:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getLearningSession:', error)
    return { success: false, error: "Failed to fetch learning session" }
  }
}

// Get all learning sessions for a user (for progress tracking)
export async function getUserLearningSessions(classId?: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    let query = supabase
      .from('learning_sessions')
      .select(`
        *,
        lessons (
          id,
          title,
          description,
          difficulty
        ),
        classes (
          id,
          class_code
        )
      `)
      .eq('profile_id', user.id)
      .order('started_at', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching user learning sessions:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getUserLearningSessions:', error)
    return { success: false, error: "Failed to fetch learning sessions" }
  }
}