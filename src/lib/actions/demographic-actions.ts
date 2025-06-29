'use server'

import { createClient } from '@/utils/supabase/server'
import { DemographicData } from '@/types'

export async function checkDemographicCompletion(classId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('user_demographics')
      .select('id, completed_at')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking demographic completion:', error)
      return { success: false, error: 'Failed to check demographic status' }
    }

    // Return whether demographics are completed for this class
    return { 
      success: true, 
      completed: !!data,
      data: data 
    }
  } catch (error) {
    console.error('Unexpected error checking demographics:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function saveDemographicData(classId: string, demographicData: DemographicData) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate required fields
    const requiredFields = ['age', 'gender', 'education', 'major', 'yearsOfExperience']
    const missingFields = requiredFields.filter(field => !demographicData[field as keyof DemographicData])
    
    if (missingFields.length > 0) {
      return { 
        success: false, 
        error: `Please fill in all required fields: ${missingFields.join(', ')}` 
      }
    }

    // Insert or update demographic data
    const { data, error } = await supabase
      .from('user_demographics')
      .upsert({
        user_id: user.id,
        class_id: classId,
        name: demographicData.name || null,
        age: demographicData.age,
        gender: demographicData.gender,
        ethnicity: demographicData.ethnicity,
        education: demographicData.education,
        major: demographicData.major,
        programming_experience: demographicData.programmingExperience,
        years_of_experience: demographicData.yearsOfExperience,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,class_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving demographic data:', error)
      return { success: false, error: 'Failed to save demographic information' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error saving demographics:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getUserDemographics(classId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('user_demographics')
      .select('*')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching demographic data:', error)
      return { success: false, error: 'Failed to fetch demographic information' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching demographics:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}