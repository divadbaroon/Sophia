'use server'

import { createClient } from '@/utils/supabase/server'

export interface UserHighlightData {
  sessionId: string
  classId: string
  highlightedText: string
}

export interface UserHighlightResponse {
  success: boolean
  error?: string
  data?: any
}

/**
 * Save a user highlight action to the database
 */
export async function saveUserHighlightAction(
  data: UserHighlightData
): Promise<UserHighlightResponse> {
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

    // Insert highlight action record
    const { data: highlightAction, error: insertError } = await supabase
      .from('user_highlight_actions')
      .insert([{
        profile_id: user.id,
        session_id: data.sessionId,
        class_id: data.classId,
        highlighted_text: data.highlightedText
      }])
      .select()

    if (insertError) {
      console.error('❌ Failed to save user highlight action:', insertError)
      return { 
        success: false, 
        error: insertError.message 
      }
    }

    console.log('✅ User highlight action saved:', data)
    return { 
      success: true, 
      data: highlightAction 
    }

  } catch (error) {
    console.error('❌ Error saving user highlight action:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get user highlight actions for a session
 */
export async function getUserHighlightActions(
  sessionId: string
): Promise<UserHighlightResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { 
        success: false, 
        error: 'Not authenticated' 
      }
    }

    const { data: highlights, error: fetchError } = await supabase
      .from('user_highlight_actions')
      .select('*')
      .eq('session_id', sessionId)
      .order('highlighted_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Failed to fetch user highlight actions:', fetchError)
      return { 
        success: false, 
        error: fetchError.message 
      }
    }

    return { 
      success: true, 
      data: highlights 
    }

  } catch (error) {
    console.error('❌ Error fetching user highlight actions:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}