'use server'

import { createClient } from '@/utils/supabase/server'

export async function getClassLessons(classId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' }
  }

  try {
    // First verify user is enrolled in this class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .single()

    if (enrollmentError || !enrollment) {
      return { data: null, error: 'You are not enrolled in this class' }
    }

    // Get lessons for this class
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('class_id', classId)
      .order('estimated_time_mins') // Order by time for now
    
    console.log(lessons)

    if (lessonsError) {
      return { data: null, error: lessonsError.message }
    }

    return { data: lessons, error: null }

  } catch (error) {
    console.error('Error fetching class lessons:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}