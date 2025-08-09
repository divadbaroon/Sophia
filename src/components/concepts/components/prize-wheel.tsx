import React, { useState } from 'react'

import { X } from 'lucide-react'

import { useEligibilityCheck } from '@/lib/hooks/prizeWheel/useEligibilityCheck'
import { usePrizeSave } from '@/lib/hooks/prizeWheel/usePrizeSave'
import { useWheelSpinner } from '@/lib/hooks/prizeWheel/useWheelSpinner'

import { LoadingModal } from '@/components/student-side/prizeWheel/LoadingModal'
import { AlreadySpunModal } from '@/components/student-side/prizeWheel/AlreadySpunModal'
import { ErrorModal } from '@/components/student-side/prizeWheel/ErrorModal'
import { WheelSpinner } from '@/components/student-side/prizeWheel/WheelSpinner'

import { ResultsModal } from '@/components/student-side/prizeWheel/ResultsModal'
import { PRIZE_WHEEL_CONFIG } from '@/utils/prize-wheel/prizeConfig'

interface PrizeWheelModalProps {
  isOpen: boolean
  onClose: () => void
  onPrizeWon: (prize: string) => void
  sessionId?: string
  lessonId?: string
}

const PrizeWheelModal: React.FC<PrizeWheelModalProps> = ({ 
  isOpen, 
  onClose, 
  onPrizeWon,
  sessionId,
  lessonId 
}) => {
  const [winner, setWinner] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const { isCheckingEligibility, isEligible, eligibilityError, previousPrize } = useEligibilityCheck(isOpen, lessonId)
  const { isSaving, saveError, hasSavedSpin, savePrizeSpinResult, resetSaveState } = usePrizeSave()

  // Handle prize won from wheel
  const handlePrizeWon = (prize: string) => {
    setWinner(prize)
    setShowResult(true)
    onPrizeWon(prize)
  }

  // Auto-save for non-winning prizes
  const handleAutoSave = async (prize: string) => {
    if (sessionId && lessonId && !hasSavedSpin) {
      await savePrizeSpinResult(sessionId, lessonId, prize)
    }
  }

  const { wheelContainerRef, isSpinning, handleSpin } = useWheelSpinner({
    isOpen,
    isEligible,
    showResult,
    prizes: PRIZE_WHEEL_CONFIG,
    onPrizeWon: handlePrizeWon,
    onAutoSave: handleAutoSave
  })

  // Handle claiming prizes
  const handleClaim = async (email?: string) => {
    if (sessionId && lessonId && winner && !hasSavedSpin) {
      const success = await savePrizeSpinResult(sessionId, lessonId, winner, email)
      if (!success) return false
    }
    
    // Reset and close
    setShowResult(false)
    setWinner(null)
    resetSaveState()
    onClose()
    return true
  }

  const handleGoBack = () => {
    window.location.href = "/classes"
  }

  if (!isOpen) return null

  // Loading state
  if (isCheckingEligibility) {
    return <LoadingModal />
  }

  // Already spun state
  if (!isEligible && previousPrize) {
    return <AlreadySpunModal onClose={onClose} onGoBack={handleGoBack} />
  }

  // Error state
  if (!isEligible && eligibilityError) {
    return <ErrorModal error={eligibilityError} onClose={onClose} />
  }

  // Main wheel content
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-blue-100 rounded-3xl p-8 max-w-2xl w-full text-center relative overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative z-10">
          {!showResult ? (
            <WheelSpinner 
              wheelContainerRef={wheelContainerRef}
              isSpinning={isSpinning}
              onSpin={handleSpin}
            />
          ) : (
            <ResultsModal
              winner={winner}
              saveError={saveError}
              isSaving={isSaving}
              onClaim={handleClaim}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .wheel-container.prize-wheel {
          filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.3));
        }
        
        .wheel-container.prize-wheel canvas {
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}

export default PrizeWheelModal