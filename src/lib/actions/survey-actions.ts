"use server"

import { createClient } from '@/utils/supabase/server'

interface SurveyData {
  // Cognitive Load
  mentalEffort: string
  difficulty: string
  concentration: string

  // System Effectiveness
  misconceptionFocus: string
  remediation: string
  learningHelp: string
  visualHelpTiming: string
  visualHelpClarity: string

  // Overall Experience
  satisfaction: string
  recommendation: string

  // Open-ended feedback
  improvements: string
  additionalComments: string
  interviewEmail: string
}

export async function saveSurveyResponse(
  sessionId: string,
  lessonId: string,
  surveyData: SurveyData
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const profileId = user.id

    // Convert string values to integers (handle empty strings)
    const parseRating = (value: string): number | null => {
      const parsed = parseInt(value)
      return isNaN(parsed) ? null : parsed
    }

    // Prepare survey data for insertion
    const surveyResponse = {
      session_id: sessionId,
      profile_id: profileId,
      lesson_id: lessonId,
      
      // Cognitive Load (required fields)
      mental_effort: parseRating(surveyData.mentalEffort),
      difficulty: parseRating(surveyData.difficulty),
      concentration: parseRating(surveyData.concentration),
      
      // System Effectiveness (required fields)
      misconception_focus: parseRating(surveyData.misconceptionFocus),
      remediation: parseRating(surveyData.remediation),
      learning_help: parseRating(surveyData.learningHelp),
      visual_help_timing: 1,
      visual_help_clarity: 1,
      
      // Overall Experience (optional fields)
      satisfaction: parseRating(surveyData.satisfaction),
      recommendation: parseRating(surveyData.recommendation),
      
      // Open-ended feedback (optional)
      improvements: surveyData.improvements.trim() || null,
      additional_comments: surveyData.additionalComments.trim() || null,
      interview_email: surveyData.interviewEmail.trim() || null,
    }

    // Validate required fields
    if (!surveyResponse.mental_effort || !surveyResponse.difficulty || 
        !surveyResponse.misconception_focus || !surveyResponse.remediation || 
        !surveyResponse.learning_help || !surveyResponse.visual_help_timing ||
        !surveyResponse.visual_help_clarity) {
      return { success: false, error: "Please complete all required fields" }
    }

    // Insert survey response
    const { data, error: insertError } = await supabase
      .from('survey_responses')
      .insert(surveyResponse)
      .select()
      .single()

    if (insertError) {
      console.error('Error saving survey response:', insertError)
      
      // Handle duplicate submission
      if (insertError.code === '23505') { // Unique constraint violation
        return { success: false, error: "Survey already submitted for this session" }
      }
      
      return { success: false, error: insertError.message }
    }

    // Optionally update the learning session to mark survey as completed
    const { error: updateError } = await supabase
      .from('learning_sessions')
      .update({
        survey_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.warn('Failed to update session survey status:', updateError)
      // Don't fail the entire operation for this
    }

    return { 
      success: true, 
      data: {
        surveyId: data.id,
        hasInterviewEmail: !!surveyResponse.interview_email
      }
    }

  } catch (error) {
    console.error('Error in saveSurveyResponse:', error)
    return { success: false, error: "Failed to save survey response" }
  }
}

export async function checkSurveyCompletion(lessonId: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { completed: false, error: "Not authenticated" }
    }

    const profileId = user.id

    // Check if user has completed survey for this lesson (similar to quiz check)
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select(`
        id,
        created_at,
        learning_sessions!inner(lesson_id)
      `)
      .eq('profile_id', profileId)
      .eq('learning_sessions.lesson_id', lessonId)
      .limit(1)

    if (error) {
      console.error('Error checking survey completion:', error)
      return { completed: false, error: error.message }
    }

    return { 
      completed: responses && responses.length > 0,
      error: null,
      submittedAt: responses?.[0]?.created_at || null
    }

  } catch (error) {
    console.error('Unexpected error checking survey completion:', error)
    return { completed: false, error: 'Failed to check survey completion' }
  }
}

export async function getSurveyResponse(sessionId: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: "Not authenticated" }
    }

    // Get survey response for this session and user
    const { data: survey, error } = await supabase
      .from('survey_responses')
      .select(`
        *,
        learning_sessions!inner(lesson_id),
        lessons!inner(title, description)
      `)
      .eq('session_id', sessionId)
      .eq('profile_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching survey response:', error)
      return { data: null, error: error.message }
    }

    return { data: survey, error: null }

  } catch (error) {
    console.error('Unexpected error fetching survey response:', error)
    return { data: null, error: 'Failed to fetch survey response' }
  }
}