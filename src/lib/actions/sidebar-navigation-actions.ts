import { createClient } from '@/utils/supabase/client'

import { NavigationEvent } from "@/types"

// Track navigation between tasks
export async function trackNavigation(navigationData: NavigationEvent) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('sidebar_navigation_events')
      .insert({
        profile_id: user.id,
        session_id: navigationData.sessionId,
        lesson_id: navigationData.lessonId,
        from_task_index: navigationData.fromTaskIndex,
        to_task_index: navigationData.toTaskIndex,
        navigation_direction: navigationData.navigationDirection,
      })
      .select()

    if (error) {
      console.error('Error tracking navigation:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Navigation tracked: ${navigationData.navigationDirection} from task ${navigationData.fromTaskIndex} to ${navigationData.toTaskIndex}`)
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error in trackNavigation:', error)
    return { success: false, error: "Failed to track navigation" }
  }
}

// Get navigation analytics for a session
export async function getNavigationAnalytics(sessionId: string, lessonId: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('sidebar_navigation_events')
      .select('*')
      .eq('profile_id', user.id)
      .eq('session_id', sessionId)
      .eq('lesson_id', lessonId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error getting navigation analytics:', error)
      return { success: false, error: error.message }
    }

    // Calculate analytics
    const analytics = {
      totalNavigations: data?.length || 0,
      nextClicks: data?.filter(nav => nav.navigation_direction === 'next').length || 0,
      previousClicks: data?.filter(nav => nav.navigation_direction === 'previous').length || 0,
      navigationPattern: data || []
    }

    return { success: true, data: analytics }
  } catch (error) {
    console.error('Error in getNavigationAnalytics:', error)
    return { success: false, error: "Failed to get navigation analytics" }
  }
}