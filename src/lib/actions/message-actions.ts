import { createClient } from '@/utils/supabase/client'

import { MessageSave } from "@/types"

/**
 * Save a new message to Supabase `messages` table.
 */
export async function saveMessage(messageData: MessageSave) {
  const supabase = await createClient()

  // Ensure user is logged in
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Insert the message
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        profile_id: user.id,
        session_id: messageData.sessionId,
        class_id: messageData.classId,
        content: messageData.content,
        role: messageData.role ?? 'user'
      }
    ])
    .select()

  if (error) {
    console.error('Error saving message:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
