"use server"

import { createClient } from '@/utils/supabase/server'

export async function checkPrizeSpinEligibility(lessonId: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { eligible: false, error: "Not authenticated" }
    }

    const profileId = user.id

    // Check if user has already spun for this LESSON (not session)
    const { data: existingSpins, error } = await supabase
    .from('prize_spins')
    .select(`
      id, 
      prize_won, 
      spun_at
    `)
    .eq('profile_id', profileId)
    .eq('lesson_id', lessonId)
    .limit(1)

  if (error) {
    console.error('Error checking prize spin eligibility:', error)
    return { eligible: false, error: error.message }
  }

  // Check if array is empty
  if (!existingSpins || existingSpins.length === 0) {
    return { eligible: true, error: null }
  }

  const existingSpin = existingSpins[0]
  return { 
    eligible: false, 
    error: null,
    alreadySpun: true,
    previousSpin: {
      prize: existingSpin.prize_won, 
      spunAt: existingSpin.spun_at
    }
  }

  } catch (error) {
    console.error('Unexpected error checking prize spin eligibility:', error)
    return { eligible: false, error: 'Failed to check spin eligibility' }
  }
}

export async function savePrizeSpin(
  sessionId: string,
  lessonId: string,
  prizeWon: string,
  email?: string
) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Determine if this is a winning prize
    const isWinning = !prizeWon.includes("TRY AGAIN")

    // Prepare spin data
    const spinData = {
      session_id: sessionId,
      profile_id: user.id,
      lesson_id: lessonId,
      prize_won: prizeWon,
      is_winning_prize: isWinning,
      email_provided: email && isWinning ? email.trim() : null,
      email_claimed_at: email && isWinning ? new Date().toISOString() : null,
      spun_at: new Date().toISOString()
    }

    // Insert prize spin record
    const { data, error: insertError } = await supabase
      .from('prize_spins')
      .insert(spinData)
      .select()
      .single()

    if (insertError) {
      console.error('Error saving prize spin:', insertError)
      
      // Handle duplicate spin attempt
      if (insertError.code === '23505') { // Unique constraint violation
        return { success: false, error: "Prize already claimed for this lesson" }
      }
      
      return { success: false, error: insertError.message }
    }

    return { 
      success: true, 
      data: {
        spinId: data.id,
        isWinning,
        needsEmail: isWinning && !email,
        emailProvided: !!email
      }
    }

  } catch (error) {
    console.error('Error in savePrizeSpin:', error)
    return { success: false, error: "Failed to save prize spin" }
  }
}

export async function updatePrizeEmail(lessonId: string, email: string) {
  const supabase = await createClient()
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Validate email format
    if (!email.trim() || !email.includes('@')) {
      return { success: false, error: "Valid email address is required" }
    }

    // Update the prize spin with email for this lesson
    const { error: updateError } = await supabase
      .from('prize_spins')
      .update({
        email_provided: email.trim(),
        email_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('is_winning_prize', true)

    if (updateError) {
      console.error('Error updating prize email:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Error in updatePrizeEmail:', error)
    return { success: false, error: "Failed to update email" }
  }
}