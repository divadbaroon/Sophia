'use server'

import { createClient } from '@/utils/supabase/server'
 
import { DemographicData } from "@/types"

export async function saveDemographicData(classCode: string, demographicData: DemographicData) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Validate all required fields are filled
  const requiredFields = ['age', 'gender', 'education', 'major', 'yearsOfExperience']
  const missingFields = requiredFields.filter(field => !demographicData[field as keyof DemographicData])
  
  if (missingFields.length > 0) {
    return { 
      success: false, 
      error: `Please fill in all required fields: ${missingFields.join(', ')}` 
    }
  }

  try {
    // Find the class by class_code to get class_id
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, class_code')
      .eq('class_code', classCode)
      .single()

    if (classError || !classData) {
      return { success: false, error: 'Class not found. Please check the class code.' }
    }

    // Save demographic data
    const { error: demographicError } = await supabase
      .from('user_demographics')
      .insert({
        user_id: user.id,
        class_id: classData.id,
        age: demographicData.age,
        gender: demographicData.gender,
        ethnicity: demographicData.ethnicity || null,
        education: demographicData.education,
        major: demographicData.major,
        programming_experience: demographicData.programmingExperience || null,
        years_of_experience: demographicData.yearsOfExperience
      })

    if (demographicError) {
      console.error('Demographic save error:', demographicError)
      return { success: false, error: 'Failed to save demographic information' }
    }

    return { 
      success: true, 
      message: 'Demographic information saved successfully!',
      classData: classData 
    }

  } catch (error) {
    console.error('Save demographics error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}