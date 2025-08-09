import { useState, useEffect } from 'react'
import { checkPrizeSpinEligibility } from '@/lib/actions/prize-wheel-actions'

export const useEligibilityCheck = (isOpen: boolean, lessonId?: string) => {
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true)
  const [isEligible, setIsEligible] = useState(false)
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)
  const [previousPrize, setPreviousPrize] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset states when modal closes
      setIsCheckingEligibility(true)
      setIsEligible(false)
      setEligibilityError(null)
      setPreviousPrize(null)
      return
    }

    const checkEligibility = async () => {
      if (!lessonId) {
        setIsCheckingEligibility(false)
        return
      }

      setIsCheckingEligibility(true)
      setEligibilityError(null)

      try {
        const result = await checkPrizeSpinEligibility(lessonId)
        
        if (result.error && result.error !== "Not authenticated") {
          setEligibilityError(result.error)
          setIsEligible(false)
        } else if (result.alreadySpun && result.previousSpin) {
          setIsEligible(false)
          setPreviousPrize(result.previousSpin.prize)
        } else if (result.eligible) {
          setIsEligible(true)
        } else {
          setIsEligible(false)
          setEligibilityError("Unable to verify eligibility")
        }
      } catch (error) {
        setEligibilityError("Failed to check eligibility")
        setIsEligible(false)
      } finally {
        setIsCheckingEligibility(false)
      }
    }

    checkEligibility()
  }, [isOpen, lessonId])

  return {
    isCheckingEligibility,
    isEligible,
    eligibilityError,
    previousPrize
  }
}

