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