"use server"

import { createClient } from '@/utils/supabase/server'

import { SurveyData } from "@/types"

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

    // Check if user used Sophia
    const usedSophia = surveyData.sophiaUsageFrequency !== "not-at-all" && surveyData.sophiaUsageFrequency !== ""

    // Prepare survey data for insertion 
    const surveyResponse = {
      session_id: sessionId,
      profile_id: profileId,
      lesson_id: lessonId,
      survey_version: 'v3', 
      
      // Sophia Usage
      sophia_usage_frequency: surveyData.sophiaUsageFrequency.trim() || null,
      
      // AI Assistant Experience (only if used Sophia)
      sophia_helpfulness: usedSophia ? parseRating(surveyData.sophiaHelpfulness) : null,
      sophia_reliability: parseRating(surveyData.sophiaReliability),
      instructor_alignment: usedSophia ? parseRating(surveyData.instructorAlignment) : null,
      ai_vs_human_preference: surveyData.aiVsHumanPreference.trim() || null,
      appropriate_help: usedSophia ? parseRating(surveyData.appropriateHelp) : null,

      // Learning Effectiveness 
      concept_understanding: parseRating(surveyData.conceptUnderstanding),
      problem_solving_improvement: usedSophia ? parseRating(surveyData.problemSolvingImprovement) : null,
      learning_autonomy: parseRating(surveyData.learningAutonomy),

      // System Experience (only if used Sophia)
      voice_interaction_quality: usedSophia ? parseRating(surveyData.voiceInteractionQuality) : null,
      comfort_with_ai: usedSophia ? parseRating(surveyData.comfortWithAI) : null,

      // General System Experience
      ease_of_use: parseRating(surveyData.easeOfUse),

      // Trust & Confidence (only if used Sophia)
      trust_in_guidance: parseRating(surveyData.trustInGuidance),
      confidence_in_learning: parseRating(surveyData.confidenceInLearning),

      // Open-ended feedback (conditional based on Sophia usage)
      best_aspects: (usedSophia && surveyData.bestAspects.trim()) ? surveyData.bestAspects.trim() : null,
      improvements: (usedSophia && surveyData.improvements.trim()) ? surveyData.improvements.trim() : null,
      comparison_to_instructor: (usedSophia && surveyData.comparisonToInstructor.trim()) ? surveyData.comparisonToInstructor.trim() : null,
      additional_comments: surveyData.additionalComments.trim() || null,
      interview_email: surveyData.interviewEmail.trim() || null,

      // Leave old fields as NULL for new surveys
      sophia_teaching_style: null, // Removed in v3
      exam_preparation: null,
      mental_effort: null,
      difficulty: null,
      concentration: null,
      misconception_focus: null,
      remediation: null,
      learning_help: null,
      visual_help_timing: null,
      visual_help_clarity: null,
      satisfaction: null,
      recommendation: null,
    }

    // Validate required fields for v3 survey version
    const requiredFields = usedSophia 
      ? [
          surveyResponse.sophia_usage_frequency,
          surveyResponse.sophia_helpfulness,
          surveyResponse.instructor_alignment,
          surveyResponse.concept_understanding,
          surveyResponse.learning_autonomy
        ]
      : [
          surveyResponse.sophia_usage_frequency,
          surveyResponse.concept_understanding,
          surveyResponse.learning_autonomy
        ]

    if (requiredFields.some(field => field === null || field === undefined || field === "")) {
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

    // Update the learning session to mark survey as completed
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
        hasInterviewEmail: !!surveyResponse.interview_email,
        usedSophia: usedSophia
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

    // Check if user has completed survey for this lesson 
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select(`
        id,
        created_at,
        survey_version,
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
      submittedAt: responses?.[0]?.created_at || null,
      surveyVersion: responses?.[0]?.survey_version || null
    }

  } catch (error) {
    console.error('Unexpected error checking survey completion:', error)
    return { completed: false, error: 'Failed to check survey completion' }
  }
}