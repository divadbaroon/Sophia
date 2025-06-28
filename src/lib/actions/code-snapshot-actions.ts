import { createClient } from '@/utils/supabase/client'

import { CodeSave } from "@/types"

// Save code snapshot 
export async function saveCodeSnapshot(codeData: CodeSave) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

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

    if (insertError) {
      console.error('Error saving code snapshot:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log('✅ Code snapshot saved (new record created)')
    return { success: true, data }
  } catch (error) {
    console.error('Error in saveCodeSnapshot:', error)
    return { success: false, error: "Failed to save code" }
  }
}

// Load all saved code for a session - gets latest for each task
export async function loadAllCodeSnapshots(sessionId: string, lessonId: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get ALL records 
    const { data, error } = await supabase
      .from('code_snapshots')
      .select('task_index, method_id, code_content, created_at')
      .eq('profile_id', user.id)
      .eq('session_id', sessionId)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false }) // Newest first

    if (error) {
      console.error('Error loading all code snapshots:', error)
      return { success: false, error: error.message }
    }

    // Convert to methodsCode format 
    const methodsCode: Record<string, string> = {}
    const seenMethods = new Set<string>()

    data?.forEach(snapshot => {
      // Only keep the first (newest) occurrence of each method_id for loading
      if (!seenMethods.has(snapshot.method_id)) {
        methodsCode[snapshot.method_id] = snapshot.code_content
        seenMethods.add(snapshot.method_id)
      }
    })

    return { success: true, methodsCode }
  } catch (error) {
    console.error('Error in loadAllCodeSnapshots:', error)
    return { success: false, error: "Failed to load code snapshots" }
  }
}
