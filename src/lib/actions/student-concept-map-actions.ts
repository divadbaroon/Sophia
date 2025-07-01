'use server'

import { createClient } from '@/utils/supabase/server'

interface ConceptMapEntry {
  understandingLevel: number;
  confidenceInAssessment: number;
  reasoning: string;
  lastUpdated: string;
}

interface ConceptMap {
  [conceptName: string]: ConceptMapEntry;
}

// Get student's concept map for a specific task
export async function getStudentConceptMap(
  codingTaskId: string
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: "Not authenticated" }
    }
    
    const profileId = user.id
    
    const { data, error } = await supabase
      .from('student_concept_maps')
      .select('concept_data')
      .eq('profile_id', profileId)
      .eq('coding_task_id', codingTaskId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching student concept map:', error)
      return { data: null, error: error.message }
    }
    
    return { 
      data: data?.concept_data || null, 
      error: null 
    }
  } catch (error) {
    console.error('Unexpected error fetching student concept map:', error)
    return { data: null, error: 'Failed to fetch concept map' }
  }
}

// Get concept map template for a task (fallback if no student map exists)
export async function getConceptMapTemplate(codingTaskId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('concept_map_templates')
      .select('template_data')
      .eq('coding_task_id', codingTaskId)
      .single()
    
    if (error) {
      console.error('Error fetching concept map template:', error)
      return { data: null, error: error.message }
    }
    
    return { 
      data: data.template_data, 
      error: null 
    }
  } catch (error) {
    console.error('Unexpected error fetching concept map template:', error)
    return { data: null, error: 'Failed to fetch template' }
  }
}

// Save/update student's concept map
export async function saveStudentConceptMap(
  lessonId: string,
  codingTaskId: string,
  methodTitle: string,
  conceptData: ConceptMap
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }
    
    const profileId = user.id
    
    // Get existing version number first
    const { data: existingMaps } = await supabase
      .from('student_concept_maps')
      .select('version')
      .eq('profile_id', profileId)
      .eq('coding_task_id', codingTaskId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = existingMaps && existingMaps.length > 0 
      ? existingMaps[0].version + 1 
      : 1

    // First, deactivate any existing concept maps
    if (existingMaps && existingMaps.length > 0) {
      await supabase
        .from('student_concept_maps')
        .update({ is_active: false })
        .eq('profile_id', profileId)
        .eq('coding_task_id', codingTaskId)
    }

    // Insert new concept map with proper version
    const { data, error } = await supabase
      .from('student_concept_maps')
      .insert({
        profile_id: profileId,
        lesson_id: lessonId,
        coding_task_id: codingTaskId,
        method_title: methodTitle,
        concept_data: conceptData,
        version: nextVersion,
        is_active: true
      })
    
    if (error) {
      console.error('Error saving student concept map:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error saving concept map:', error)
    return { success: false, error: 'Failed to save concept map' }
  }
}

// Load concept map for a student-task combination (with template fallback)
export async function loadStudentConceptMapWithFallback(
  codingTaskId: string,
  methodTitle: string
): Promise<{ data: ConceptMap | null, error: string | null, source: 'student' | 'template' | null }> {
  
  // First try to get existing student concept map
  const studentResult = await getStudentConceptMap(codingTaskId)
  
  if (studentResult.data) {
    console.log(`📊 Found existing concept map for ${methodTitle}`)
    return { 
      data: studentResult.data, 
      error: null, 
      source: 'student' 
    }
  }
  
  // If no student map exists, get template
  console.log(`📋 No student concept map found, loading template for ${methodTitle}`)
  const templateResult = await getConceptMapTemplate(codingTaskId)
  
  if (templateResult.data) {
    console.log(`✅ Using template concept map for ${methodTitle}`)
    return { 
      data: templateResult.data, 
      error: null, 
      source: 'template' 
    }
  }
  
  // If both fail, return error
  return { 
    data: null, 
    error: 'No concept map or template found', 
    source: null 
  }
}

// Get all concept maps for a lesson (useful for dashboard/analytics)
export async function getAllStudentConceptMapsForLesson(
  lessonId: string
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: "Not authenticated" }
    }
    
    const profileId = user.id
    
    const { data, error } = await supabase
      .from('student_concept_maps')
      .select(`
        id,
        method_title,
        concept_data,
        version,
        created_at,
        updated_at,
        coding_tasks (
          title,
          difficulty
        )
      `)
      .eq('profile_id', profileId)
      .eq('lesson_id', lessonId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching lesson concept maps:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error fetching lesson concept maps:', error)
    return { data: null, error: 'Failed to fetch concept maps' }
  }
}