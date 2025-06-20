"use server"

import { createClient } from '@/utils/supabase/server'

export async function getQuizQuestions(lessonId: string) {
  const supabase = await createClient()
  
  try {
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('question_order', { ascending: true })

    if (error) {
      console.error('Error fetching quiz questions:', error)
      return { data: null, error: error.message }
    }

    // Transform database format to match QuizModal expectations
    const formattedQuestions = questions?.map(q => ({
      question: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correctAnswer: q.correct_answer,
    }))

    return { data: formattedQuestions, error: null }
  } catch (error) {
    console.error('Unexpected error fetching quiz questions:', error)
    return { data: null, error: 'Failed to fetch quiz questions' }
  }
}

export async function saveQuizResponses(
  sessionId: string, 
  responses: Array<{
    questionId: string
    selectedAnswer: string
    isCorrect: boolean
  }>,
  quizType: 'pre' | 'post'
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Prepare the response data
    const quizResponses = responses.map(response => ({
      session_id: sessionId,
      question_id: response.questionId,
      selected_answer: response.selectedAnswer,
      is_correct: response.isCorrect,
      quiz_type: quizType,
      answered_at: new Date().toISOString()
    }))

    // Insert all responses
    const { error: insertError } = await supabase
      .from('session_quiz_responses')
      .insert(quizResponses)

    if (insertError) {
      console.error('Error saving quiz responses:', insertError)
      return { success: false, error: insertError.message }
    }

    // Update the learning session with quiz completion
    const updateField = quizType === 'pre' ? 'pre_quiz_completed_at' : 'post_quiz_completed_at'
    const { error: updateError } = await supabase
      .from('learning_sessions')
      .update({
        [updateField]: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating learning session:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in saveQuizResponses:', error)
    return { success: false, error: "Failed to save quiz responses" }
  }
}