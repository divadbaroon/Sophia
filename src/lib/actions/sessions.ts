'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateSessionFormData } from '@/types'

export async function createSession(formData: CreateSessionFormData) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('code', formData.course.code)
      .single()

    if (courseError) {
      return { error: 'Course not found' }
    }

    // Create session with the course_id and user_id
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        name: formData.name,
        course_id: courseData.id,
        duration: formData.duration,
        date: formData.date,
        location_type: formData.location.type,
        location_details: formData.location.details,
        description: formData.description,
        status: 'upcoming',
        time: new Date(formData.date).toLocaleTimeString(),
        user_id: user.id
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return { error: sessionError.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data: session }
  } catch (error) {
    console.error('Session creation error:', error)
    return { error: 'Failed to create session' }
  }
}

export async function getPastSessions() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    // Fetch sessions with their course information
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching past sessions:', error)
      return { error: error.message }
    }

    // Fetch metrics and feedback for each session
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const [metricsResult, feedbackResult] = await Promise.all([
          supabase
            .from('past_session_metrics')
            .select('*')
            .eq('session_id', session.id)
            .single(),
          supabase
            .from('feedback')
            .select('*')
            .eq('session_id', session.id)
            .single()
        ])

        // Default metrics for sessions without metrics
        const defaultMetrics = {
          studentsHelped: 0,
          averageWaitTime: 0,
          peakQueueSize: 0,
          totalDuration: session.duration,
          actualStartTime: session.date,
          actualEndTime: new Date(new Date(session.date).getTime() + session.duration * 60000).toISOString(),
          topicsCovered: [],
          commonIssues: [],
          conceptualBreakthroughs: 0,
          studentSatisfaction: 0
        }

        return {
          id: session.id,
          name: session.name,
          course: {
            id: session.course.id,
            name: session.course.name,
            code: session.course.code
          },
          status: 'past' as const,
          date: session.date,
          duration: session.duration,
          location: {
            type: session.location_type as "physical" | "virtual" | "hybrid",
            details: session.location_details
          },
          metrics: metricsResult.data ? {
            studentsHelped: metricsResult.data.students_helped,
            averageWaitTime: metricsResult.data.average_wait_time,
            peakQueueSize: metricsResult.data.peak_queue_size,
            totalDuration: metricsResult.data.total_duration,
            actualStartTime: metricsResult.data.actual_start_time,
            actualEndTime: metricsResult.data.actual_end_time,
            topicsCovered: metricsResult.data.topics_covered,
            commonIssues: metricsResult.data.common_issues,
            conceptualBreakthroughs: metricsResult.data.conceptual_breakthroughs,
            studentSatisfaction: metricsResult.data.student_satisfaction
          } : defaultMetrics,
          feedback: feedbackResult.data ? {
            averageRating: feedbackResult.data.average_rating,
            responses: feedbackResult.data.responses,
            comments: feedbackResult.data.comments,
            improvements: feedbackResult.data.improvements
          } : undefined
        }
      })
    )

    return { success: true, data: sessionsWithDetails }
  } catch (error) {
    console.error('Error in getPastSessions:', error)
    return { error: 'Failed to fetch past sessions' }
  }
}

export async function getAllSessions() {
    const supabase = await createClient()
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { error: 'Not authenticated' }
      }
  
      // Fetch all sessions with their course information
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
  
      if (error) {
        console.error('Error fetching sessions:', error)
        return { error: error.message }
      }
  
      // Fetch metrics and feedback for each session
      const sessionsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          // Only fetch metrics and feedback for past sessions
          if (session.status === 'past') {
            const [metricsResult, feedbackResult] = await Promise.all([
              supabase
                .from('past_session_metrics')
                .select('*')
                .eq('session_id', session.id)
                .single(),
              supabase
                .from('feedback')
                .select('*')
                .eq('session_id', session.id)
                .single()
            ])
  
            const defaultMetrics = {
              studentsHelped: 0,
              averageWaitTime: 0,
              peakQueueSize: 0,
              totalDuration: session.duration,
              actualStartTime: session.date,
              actualEndTime: new Date(new Date(session.date).getTime() + session.duration * 60000).toISOString(),
              topicsCovered: [],
              commonIssues: [],
              conceptualBreakthroughs: 0,
              studentSatisfaction: 0
            }
  
            return {
              id: session.id,
              name: session.name,
              course: {
                id: session.course.id,
                name: session.course.name,
                code: session.course.code
              },
              status: session.status as 'past',
              date: session.date,
              duration: session.duration,
              location: {
                type: session.location_type as "physical" | "virtual" | "hybrid",
                details: session.location_details
              },
              metrics: metricsResult.data ? {
                studentsHelped: metricsResult.data.students_helped,
                averageWaitTime: metricsResult.data.average_wait_time,
                peakQueueSize: metricsResult.data.peak_queue_size,
                totalDuration: metricsResult.data.total_duration,
                actualStartTime: metricsResult.data.actual_start_time,
                actualEndTime: metricsResult.data.actual_end_time,
                topicsCovered: metricsResult.data.topics_covered,
                commonIssues: metricsResult.data.common_issues,
                conceptualBreakthroughs: metricsResult.data.conceptual_breakthroughs,
                studentSatisfaction: metricsResult.data.student_satisfaction
              } : defaultMetrics,
              feedback: feedbackResult.data ? {
                averageRating: feedbackResult.data.average_rating,
                responses: feedbackResult.data.responses,
                comments: feedbackResult.data.comments,
                improvements: feedbackResult.data.improvements
              } : undefined
            }
          } else {
            // For active and upcoming sessions, return without metrics/feedback
            return {
              id: session.id,
              name: session.name,
              course: {
                id: session.course.id,
                name: session.course.name,
                code: session.course.code
              },
              status: session.status as 'active' | 'upcoming',
              date: session.date,
              duration: session.duration,
              location: {
                type: session.location_type as "physical" | "virtual" | "hybrid",
                details: session.location_details
              },
              description: session.description,
              time: session.time
            }
          }
        })
      )
  
      return { success: true, data: sessionsWithDetails }
    } catch (error) {
      console.error('Error in getAllSessions:', error)
      return { error: 'Failed to fetch sessions' }
    }
  }

