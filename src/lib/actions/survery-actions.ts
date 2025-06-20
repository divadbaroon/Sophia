"use server"

import { createClient } from "@/utils/supabase/server"

// Save the end-of-session survey
export async function saveLearningSessionSurvey(
  sessionId: string,
  surveyData: {
    difficulty_rating: number // 1-5 scale
    engagement_rating: number // 1-5 scale
    understanding_rating: number // 1-5 scale
    ai_helpfulness_rating?: number // 1-5 scale
    feedback_text?: string
    would_recommend: boolean
  }
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Insert survey response
    const { error: insertError } = await supabase
      .from('session_surveys')
      .insert({
        session_id: sessionId,
        ...surveyData,
        submitted_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error saving survey:', insertError)
      return { success: false, error: insertError.message }
    }

    // Update learning session to mark survey as completed
    const { error: updateError } = await supabase
      .from('learning_sessions')
      .update({
        survey_completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session with survey completion:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in saveLearningSessionSurvey:', error)
    return { success: false, error: "Failed to save survey" }
  }
}
