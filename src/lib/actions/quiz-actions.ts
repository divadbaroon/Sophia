"use server"

import { createClient } from '@/utils/supabase/server'

export async function getQuizQuestions(lessonId: string, quizType: 'pre' | 'post') {
  const supabase = await createClient()
  
  try {
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('quiz_type', quizType)  
      .order('question_order', { ascending: true })

    if (error) {
      console.error('Error fetching quiz questions:', error)
      return { data: null, error: error.message }
    }

    // Transform database format to match QuizModal expectations
    const formattedQuestions = questions?.map(q => ({
      id: q.id, 
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

    // Calculate score
    const correctAnswers = responses.filter(r => r.isCorrect).length
    const score = Math.round((correctAnswers / responses.length) * 100)

    // Prepare the response data
    const quizResponses = responses.map(response => ({
      session_id: sessionId,
      question_id: response.questionId,
      selected_answer: parseInt(response.selectedAnswer),
      is_correct: response.isCorrect,
      quiz_type: quizType,
      response_time_seconds: null
    }))

    // Insert all responses
    const { error: insertError } = await supabase
      .from('session_quiz_responses')
      .insert(quizResponses)

    if (insertError) {
      console.error('Error saving quiz responses:', insertError)
      return { success: false, error: insertError.message }
    }

    // Update the learning session with quiz score
    const scoreField = quizType === 'pre' ? 'pre_quiz_score' : 'post_quiz_score'
    const { error: updateError } = await supabase
      .from('learning_sessions')
      .update({
        [scoreField]: score
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