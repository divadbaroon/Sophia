import { useSession } from '@/lib/context/session/SessionProvider'
import { trackSophiaInteraction } from '@/lib/actions/sophia-button-interaction-actions'

export const useSophiaButtonInteractionTracking = () => {
  const { sessionId, lessonId, currentMethodIndex } = useSession()
  
  const trackInteraction = (type: 'open' | 'close') => {
    // Only track if we have the required session data
    if (!sessionId || !lessonId) {
      console.warn('Cannot track Sophia interaction: missing session data')
      return
    }

    trackSophiaInteraction({
      sessionId,
      lessonId,
      currentTaskIndex: currentMethodIndex,
      interactionType: type
    }).catch(error => {
      console.error(`Failed to track Sophia ${type} interaction:`, error)
    })
  }

  // Convenience methods 
  const trackOpen = () => trackInteraction('open')
  const trackClose = () => trackInteraction('close')

  return {
    trackInteraction,
    trackOpen,
    trackClose,
  }
}