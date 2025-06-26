import { createClient } from '@/utils/supabase/client'

import { CodeSave } from "@/types"

// Save or update code snapshot 
export async function saveCodeSnapshot(codeData: CodeSave) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // First, check if a record exists
    const { data: existing, error: checkError } = await supabase
      .from('code_snapshots')
      .select('id')
      .eq('profile_id', user.id)
      .eq('session_id', codeData.sessionId)
      .eq('lesson_id', codeData.lessonId)
      .eq('task_index', codeData.taskIndex)
      .eq('method_id', codeData.methodId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing record:', checkError)
      return { success: false, error: checkError.message }
    }

    let result
    if (existing) {
      // Update existing record
      const { data, error: updateError } = await supabase
        .from('code_snapshots')
        .update({
          code_content: codeData.codeContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()

      result = { data, error: updateError }
    } else {
      // Insert new record
      const { data, error: insertError } = await supabase
        .from('code_snapshots')
        .insert({
          profile_id: user.id,
          session_id: codeData.sessionId,
          lesson_id: codeData.lessonId,
          task_index: codeData.taskIndex,
          method_id: codeData.methodId,
          code_content: codeData.codeContent,
        })
        .select()

      result = { data, error: insertError }
    }

    if (result.error) {
      console.error('Error saving code snapshot:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log('✅ Code snapshot saved')
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error in saveCodeSnapshot:', error)
    return { success: false, error: "Failed to save code" }
  }
}

// Load all saved code for a session (for initialization)
export async function loadAllCodeSnapshots(sessionId: string, lessonId: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('code_snapshots')
      .select('task_index, method_id, code_content')
      .eq('profile_id', user.id)
      .eq('session_id', sessionId)
      .eq('lesson_id', lessonId)

    if (error) {
      console.error('Error loading all code snapshots:', error)
      return { success: false, error: error.message }
    }

    // Convert to methodsCode format
    const methodsCode: Record<string, string> = {}
    data?.forEach(snapshot => {
      methodsCode[snapshot.method_id] = snapshot.code_content
    })

    return { success: true, methodsCode }
  } catch (error) {
    console.error('Error in loadAllCodeSnapshots:', error)
    return { success: false, error: "Failed to load code snapshots" }
  }
}