import { createClient } from '@/utils/supabase/client'

import { CodeError } from "@/types"

// Save code error for tracking
export async function saveCodeError(error: CodeError) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error: insertError } = await supabase
      .from('code_errors')
      .insert({
        profile_id: user.id,
        session_id: error.sessionId,
        lesson_id: error.lessonId,
        task_index: error.taskIndex,
        error_message: error.errorMessage,
        created_at: new Date().toISOString()
      })
      .select()

    if (insertError) {
      console.error('Error saving code error:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log('✅ Code error saved for analytics')
    return { success: true, data }
  } catch (error) {
    console.error('Error in saveCodeError:', error)
    return { success: false, error: "Failed to save code error" }
  }
}