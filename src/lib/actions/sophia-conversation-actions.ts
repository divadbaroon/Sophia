'use server'

import { createClient } from '@/utils/supabase/server'

export interface SophiaConversationData {
  conversationId: string
  sessionId: string
  classId: string
}

export interface SophiaConversationResponse {
  success: boolean
  error?: string
  data?: any
}

/**
 * Save a new Sophia conversation to the database
 */
export async function saveSophiaConversation(
  data: SophiaConversationData
): Promise<SophiaConversationResponse> {
  try {
    const supabase = await createClient()

    // Ensure user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ No authenticated user found:', userError)
      return { 
        success: false, 
        error: 'Not authenticated' 
      }
    }

    // Check if conversation already exists first
    const { data: existingConversation } = await supabase
      .from('sophia_conversations')
      .select('id')
      .eq('conversation_id', data.conversationId)
      .single()

    if (existingConversation) {
      console.log('✅ Sophia conversation already exists:', data.conversationId)
      return { 
        success: true, 
        data: existingConversation 
      }
    }

    // Insert conversation record
    const { data: conversation, error: insertError } = await supabase
      .from('sophia_conversations')
      .insert([{
        profile_id: user.id,
        conversation_id: data.conversationId,
        session_id: data.sessionId,
        class_id: data.classId
      }])
      .select()

    if (insertError) {
      console.error('❌ Failed to save Sophia conversation:', insertError)
      return { 
        success: false, 
        error: insertError.message 
      }
    }

    console.log('✅ Sophia conversation saved successfully:', data.conversationId)
    return { 
      success: true, 
      data: conversation 
    }

  } catch (error) {
    console.error('❌ Error saving Sophia conversation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update conversation end time when conversation completes
 */
export async function updateSophiaConversationEndTime(
  conversationId: string
): Promise<SophiaConversationResponse> {
  try {
    const supabase = await createClient()

    // Ensure user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'Not authenticated' 
      }
    }

    const { data: conversation, error: updateError } = await supabase
      .from('sophia_conversations')
      .update({ end_time: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('profile_id', user.id) // RLS will handle this, but explicit for clarity
      .select()

    if (updateError) {
      console.error('❌ Failed to update Sophia conversation:', updateError)
      return { 
        success: false, 
        error: updateError.message 
      }
    }

    console.log(`✅ Sophia conversation end time updated:`, conversationId)
    return { 
      success: true, 
      data: conversation 
    }

  } catch (error) {
    console.error('❌ Error updating Sophia conversation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get conversation by ID
 */
export async function getSophiaConversation(
  conversationId: string
): Promise<SophiaConversationResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'Not authenticated' 
      }
    }

    const { data: conversation, error: fetchError } = await supabase
      .from('sophia_conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch Sophia conversation:', fetchError)
      return { 
        success: false, 
        error: fetchError.message 
      }
    }

    return { 
      success: true, 
      data: conversation 
    }

  } catch (error) {
    console.error('❌ Error fetching Sophia conversation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}