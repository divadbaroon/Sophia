'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a student session record in the database
 */
export async function createStudentSession(params: {
    studentId: string;
    sessionId: number;
    joinedAt: string;
  }) {
    console.log("Server: Creating student session with params:", params);
    const supabase = await createClient();
    
    try {
      // First, check if the session exists
      console.log("Server: Checking if session exists:", params.sessionId);
      const { data: sessionExists, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', params.sessionId)
        .single();
        
      if (sessionError) {
        console.error("Server: Session not found:", sessionError);
        return { error: "Session not found" };
      }
      
      console.log("Server: Session exists:", sessionExists);
      
      // Now create the student session
      console.log("Server: Inserting student session record");
      const { data, error } = await supabase
        .from('student_sessions')
        .insert({
          student_id: params.studentId,
          session_id: params.sessionId,
          joined_at: params.joinedAt
        })
        .select();
        
      if (error) {
        console.error("Server: Error inserting student session:", error);
        return { error: error.message };
      }
      
      console.log("Server: Student session created successfully:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Server: Unexpected error in createStudentSession:", error);
      return { error: "Failed to create student session" };
    }
  }


/**
 * Update a student session with conversation data 
 */
export async function updateStudentSessionData(userId: string, conversationData: any) {
  const supabase = await createClient()
  
  console.log('Updating student session data for session 5 and user:', userId);
  console.log('Data keys:', Object.keys(conversationData));
  
  try {
    // First find all the matching rows
    const { data: existingRows, error: findError } = await supabase
      .from('student_sessions')
      .select('id')
      .eq('session_id', 5)
      .eq('student_id', userId);
      
    if (findError) {
      console.error('Error finding student sessions:', findError);
      return { error: findError.message };
    }
    
    console.log(`Found ${existingRows?.length || 0} matching rows`);
    
    // If there are multiple rows, update only the most recent one
    if (existingRows && existingRows.length > 0) {
      // Get the first row's ID (or sort by created_at if you have that field)
      const rowId = existingRows[0].id;
      
      // Update just that one row by ID
      const { data, error } = await supabase
        .from('student_sessions')
        .update({
          conversation_data: conversationData,
          updated_at: new Date().toISOString()
        })
        .eq('id', rowId) // Use the ID instead of session_id and student_id
        .select();

      if (error) {
        console.error('Error updating student session data:', error);
        return { error: error.message };
      }

      console.log('Successfully updated session data');
      return { success: true, data };
    } else {
      return { error: 'No matching rows found' };
    }
  } catch (error) {
    console.error('Error in updateStudentSessionData:', error);
    return { error: 'Failed to update session data' };
  }
}

/**
 * End a student session (set left_at time)
 */
export async function endStudentSession(sessionId: number, userId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('student_sessions')
      .update({
        left_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('student_id', userId)
      .is('left_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error ending student session:', error)
      return { error: error.message }
    }

    // Update session metrics
    await updateSessionMetrics(sessionId)

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true, data }
  } catch (error) {
    console.error('Error in endStudentSession:', error)
    return { error: 'Failed to end session' }
  }
}

/**
 * Get a student's current session
 */
export async function getStudentSession(sessionId: number, userId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('student_sessions')
      .select(`
        *,
        session:sessions(*),
        user:users(*)
      `)
      .eq('session_id', sessionId)
      .eq('student_id', userId)
      .is('left_at', null)
      .single()

    if (error) {
      console.error('Error fetching student session:', error)
      return { error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getStudentSession:', error)
    return { error: 'Failed to get student session' }
  }
}

/**
 * Update session metrics based on student activity
 */
async function updateSessionMetrics(sessionId: number) {
    const supabase = await createClient()
    
    try {
      // Explicitly type the count result
      interface CountQueryResult {
        data: { id: any }[] | null;
        count: number | null;
        error: any;
      }
  
      // Get count of students who have joined this session
      const { data: studentData, count, error: countError } = await supabase
        .from('student_sessions')
        .select('id', { count: 'exact' })
        .eq('session_id', sessionId) as CountQueryResult
  
      if (countError) {
        console.error('Error counting students:', countError)
        return
      }
  
      // Now use 'count' directly instead of studentCount?.count
      const studentCount = count || 0
  
      // Check if metrics exist for this session
      const { data: existingMetrics, error: metricsError } = await supabase
        .from('past_session_metrics')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle()
  
      if (metricsError && metricsError.code !== 'PGRST116') {
        console.error('Error checking metrics:', metricsError)
        return
      }
  
      if (existingMetrics) {
        // Update existing metrics
        await supabase
          .from('past_session_metrics')
          .update({
            students_helped: studentCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetrics.id)
      } else {
        // Create new metrics
        await supabase
          .from('past_session_metrics')
          .insert({
            session_id: sessionId,
            students_helped: studentCount,
            average_wait_time: 0,
            peak_queue_size: studentCount,
            conceptual_breakthroughs: 0,
            student_satisfaction: 0,
            topics_covered: [],
            common_issues: []
          })
      }
    } catch (error) {
      console.error('Error updating session metrics:', error)
    }
  }