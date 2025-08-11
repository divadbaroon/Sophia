"use server"

import { createClient } from '@/utils/supabase/server'
import { VisualizationInteractionSave } from "@/types"

/**
 * Save a new visualization interaction to Supabase `visualization_interactions` table.
 */
export async function saveVisualizationInteraction(interactionData: VisualizationInteractionSave) {
  const supabase = await createClient()

  // Ensure user is logged in
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Insert the visualization interaction
  const { data, error } = await supabase
    .from('visualization_interactions')
    .insert([
      {
        profile_id: user.id,
        session_id: interactionData.sessionId,
        lesson_id: interactionData.lessonId,
        task: interactionData.task,
        action: interactionData.action,
        zone: interactionData.zone,
        x: interactionData.x,
        y: interactionData.y,
        timestamp: interactionData.timestamp
      }
    ])
    .select()

  if (error) {
    console.error('Error saving visualization interaction:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}