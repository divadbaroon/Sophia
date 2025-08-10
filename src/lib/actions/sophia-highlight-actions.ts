'use server'

import { createClient } from '@/utils/supabase/server'

export interface SophiaHighlightData {
  sessionId: string
  classId: string
  lineNumber: number
}

export interface SophiaHighlightResponse {
  success: boolean
  error?: string
  data?: any
}

/**
 * Save a Sophia highlight action to the database
 */
export async function saveSophiaHighlightAction(
  data: SophiaHighlightData
): Promise<SophiaHighlightResponse> {
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
      .from('sophia_highlight_actions')
      .insert([{
        profile_id: user.id,
        session_id: data.sessionId,
        class_id: data.classId,
        line_number: data.lineNumber
      }])
      .select()

    if (insertError) {
      console.error('❌ Failed to save Sophia highlight action:', insertError)
      return { 
        success: false, 
        error: insertError.message 
      }
    }

    console.log('✅ Sophia highlight action saved:', data)
    return { 
      success: true, 
      data: highlightAction 
    }

  } catch (error) {
    console.error('❌ Error saving Sophia highlight action:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}