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

    // Prepare survey data for insertion 
    const surveyResponse = {
      session_id: sessionId,
      profile_id: profileId,
      lesson_id: lessonId,
      survey_version: 'v2', 
      
      // AI Assistant Experience 
      sophia_helpfulness: parseRating(surveyData.sophiaHelpfulness),
      sophia_reliability: parseRating(surveyData.sophiaReliability),
      sophia_teaching_style: parseRating(surveyData.sophiaTeachingStyle),
      instructor_alignment: parseRating(surveyData.instructorAlignment),
      ai_vs_human_preference: surveyData.aiVsHumanPreference.trim() || null,

      // Learning Effectiveness 
      concept_understanding: parseRating(surveyData.conceptUnderstanding),
      problem_solving_improvement: parseRating(surveyData.problemSolvingImprovement),
      learning_autonomy: parseRating(surveyData.learningAutonomy),

      // System Experience 
      ease_of_use: parseRating(surveyData.easeOfUse),
      voice_interaction_quality: parseRating(surveyData.voiceInteractionQuality),
      appropriate_help: parseRating(surveyData.appropriateHelp),

      // Trust & Confidence 
      trust_in_guidance: parseRating(surveyData.trustInGuidance),
      confidence_in_learning: parseRating(surveyData.confidenceInLearning),
      comfort_with_ai: parseRating(surveyData.comfortWithAI),

      // Open-ended feedback
      best_aspects: surveyData.bestAspects.trim() || null,
      improvements: surveyData.improvements.trim() || null,
      comparison_to_instructor: surveyData.comparisonToInstructor.trim() || null,
      additional_comments: surveyData.additionalComments.trim() || null,
      interview_email: surveyData.interviewEmail.trim() || null,

      // Leave old fields as NULL for new surveys
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

    // Validate required fields for v2 survey version
    if (!surveyResponse.sophia_helpfulness || !surveyResponse.sophia_teaching_style || 
        !surveyResponse.instructor_alignment || !surveyResponse.concept_understanding || 
        !surveyResponse.learning_autonomy) {
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

