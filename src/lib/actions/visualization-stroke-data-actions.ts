"use server"

import { createClient } from '@/utils/supabase/server'

export interface SimpleStrokeDataSave {
  sessionId: string
  lessonId: string
  task: string
  zone: string
  strokeNumber: number
  pointCount: number
  completePoints: Array<{x: number, y: number, timestamp: number}>
  startPoint: {x: number, y: number, timestamp: number}
  endPoint: {x: number, y: number, timestamp: number}
}


export async function saveVisualizationStrokeData(strokeData: SimpleStrokeDataSave) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('visualization_stroke_data')
    .insert([
      {
        profile_id: user.id,
        session_id: strokeData.sessionId,
        lesson_id: strokeData.lessonId,
        task: strokeData.task,
        zone: strokeData.zone,
        stroke_number: strokeData.strokeNumber,
        point_count: strokeData.pointCount,
        complete_points: strokeData.completePoints,
        start_point: strokeData.startPoint,
        end_point: strokeData.endPoint
      }
    ])
    .select()

  if (error) {
    console.error('Error saving stroke data:', error)
    return { success: false, error: error.message }
  }

  console.log(`💾 Saved stroke ${strokeData.strokeNumber} with ${strokeData.pointCount} points`)
  return { success: true, data }
}