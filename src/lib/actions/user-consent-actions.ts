"use server"

import { createClient } from '@/utils/supabase/server'

export async function saveUserConsent(consented: boolean) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const consentData = {
      profile_id: user.id,
      consented: consented,
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabase
      .from('user_consent')
      .upsert(consentData, {
        onConflict: 'profile_id'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving user consent:', insertError)
      return { success: false, error: insertError.message }
    }

    return { 
      success: true, 
      data: {
        consentId: data.id,
        consented: data.consented
      }
    }

  } catch (error) {
    console.error('Error in saveUserConsent:', error)
    return { success: false, error: "Failed to save user consent" }
  }
}

export async function hasUserConsented() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('user_consent')
      .select('consented')
      .eq('profile_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user consent:', error)
      return { success: false, error: error.message }
    }

    // No record = hasn't consented, false = declined, true = consented
    const hasConsented = data?.consented === true

    return { success: true, hasConsented }

  } catch (error) {
    console.error('Error in hasUserConsented:', error)
    return { success: false, error: "Failed to check user consent" }
  }
}