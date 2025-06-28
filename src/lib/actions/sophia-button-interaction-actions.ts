import { createClient } from '@/utils/supabase/client'

import { SophiaInteractionEvent } from "@/types"

// Track Sophia button interactions
export async function trackSophiaInteraction(interactionData: SophiaInteractionEvent) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('sophia_button_interaction_events')
      .insert({
        profile_id: user.id,
        session_id: interactionData.sessionId,
        lesson_id: interactionData.lessonId,
        current_task_index: interactionData.currentTaskIndex,
        interaction_type: interactionData.interactionType,
      })
      .select()

    if (error) {
      console.error('Error tracking Sophia interaction:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Sophia interaction tracked: ${interactionData.interactionType} on task ${interactionData.currentTaskIndex}`)
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error in trackSophiaInteraction:', error)
    return { success: false, error: "Failed to track Sophia interaction" }
  }
}
