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

    console.log('✅ Learning session started:', data.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error in createLearningSession:', error)
    return { success: false, error: "Failed to create learning session" }
  }
}

export async function completeLessonProgress(sessionId: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // update the existing session to completed
    const { data, error } = await supabase
      .from('learning_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('profile_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error completing session:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Session completed:', sessionId)
    return { success: true, data }
  } catch (error) {
    console.error('Error in completeLessonProgress:', error)
    return { success: false, error: "Failed to complete session" }
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