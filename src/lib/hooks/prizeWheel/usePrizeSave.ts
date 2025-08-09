import { useState } from 'react'
import { savePrizeSpin } from '@/lib/actions/prize-wheel-actions'

export const usePrizeSave = () => {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasSavedSpin, setHasSavedSpin] = useState(false)

  const savePrizeSpinResult = async (
    sessionId: string,
    lessonId: string,
    prize: string,
    email?: string
  ) => {
    if (!sessionId || !lessonId) return false

    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await savePrizeSpin(sessionId, lessonId, prize, email)
      
      if (!result.success) {
        setSaveError(result.error || "Failed to save prize")
        return false
      }
      
      setHasSavedSpin(true)
      return true
    } catch {
      setSaveError("An unexpected error occurred")
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const resetSaveState = () => {
    setSaveError(null)
    setHasSavedSpin(false)
    setIsSaving(false)
  }

  return {
    isSaving,
    saveError,
    hasSavedSpin,
    savePrizeSpinResult,
    resetSaveState
  }
}