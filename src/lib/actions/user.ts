'use server'

import { createClient } from '@/utils/supabase/server'

export async function checkAuthStatus() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (user && !error) {
    return {
      user: {
        id: user.id,
        firstName: user.user_metadata.firstName || '',
        lastName: user.user_metadata.lastName || ''
      },
      isAuthenticated: true
    }
  }
  
  return { user: null, isAuthenticated: false }
}

export async function createAnonymousUser(firstName: string, lastName: string) {
  const supabase = await createClient()
  
  try {
    // Step 1: Create anonymous user
    console.log('Creating anonymous user...')
    const { data: { user }, error } = await supabase.auth.signInAnonymously()
    
    if (error || !user) {
      console.error('Anonymous user creation failed:', error)
      throw error || new Error('Failed to create anonymous user')
    }
    console.log('Anonymous user created successfully:', user.id)

    // Step 2: Update user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { firstName, lastName }
    })

    if (metadataError) {
      console.error('Metadata update failed:', metadataError)
      throw metadataError
    }

    // Step 3: Create new student record
    console.log('Creating student record...')
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: user.id,
        name: `${firstName} ${lastName}`, 
        first_name: firstName,
        last_name: lastName
      })

    if (studentError) {
      console.error('Student record creation failed:', studentError)
      throw studentError
    }

    console.log('Student record created successfully')

    return {
      user: {
        id: user.id,
        firstName,
        lastName
      },
      error: null
    }
  } catch (error) {
    console.error('Error in createAnonymousUser:', error)
    return { user: null, error }
  }
}