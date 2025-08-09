import React, { useState } from 'react'
import { DollarSign, Heart, Trophy, Loader2 } from 'lucide-react'

interface ResultsModalProps {
  winner: string | null
  saveError: string | null
  isSaving: boolean
  onClaim: (email?: string) => Promise<boolean>
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  winner,
  saveError,
  isSaving,
  onClaim
}) => {
  const [userEmail, setUserEmail] = useState("")
  const [emailError, setEmailError] = useState("")

  const getPrizeValue = (prize: string) => {
    if (prize.includes("$5")) return "$5 Amazon Gift Card"
    if (prize.includes("$10")) return "$10 Amazon Gift Card"
    if (prize.includes("$20")) return "$20 Amazon Gift Card"
    if (prize.includes("TRY AGAIN")) return "Better luck next time!"
    return prize
  }

  const isWinningPrize = winner && !winner.includes("TRY AGAIN")

  const handleClaimClick = async () => {
    if (isWinningPrize) {
      // Validate email for winning prizes
      if (!userEmail.trim()) {
        setEmailError("Email is required to claim your prize")
        return
      }
      
      if (!userEmail.includes("@vt.edu") || !userEmail.includes(".")) {
        setEmailError("Please enter a valid VT email address")
        return
      }
      
      // Clear any previous errors
      setEmailError("")
      
      // Attempt to claim with email
      const success = await onClaim(userEmail)
      if (!success) {
        return // Don't close if save failed
      }
    } else {
      // For non-winning prizes, just claim without email
      await onClaim()
    }
  }

  return (
    <>
      {/* RESULTS PAGE */}
      <div className="mb-6">
        <div className="text-6xl mb-4">
          {isWinningPrize ? "🏆" : "💪"}
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
          {isWinningPrize ? "WINNER!" : "TRY AGAIN!"}
        </h2>
        <p className="text-gray-700 font-semibold">
          {isWinningPrize ? "YOU WON AN AWESOME PRIZE:" : "Complete another lesson for another free spin!"}
        </p>
      </div>

      {/* Error Display */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-semibold">⚠️ {saveError}</p>
        </div>
      )}

      <div className="space-y-4">
        {isWinningPrize ? (
          <>
            {/* Prize Display Card */}
            <div className="rounded-2xl p-6 border-4 bg-gradient-to-r from-yellow-200 to-orange-200 border-orange-400">
              <p className="text-2xl font-black text-gray-800 font-bold">{getPrizeValue(winner || "")}</p>
            </div>

            {/* Email input for prize winners */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 text-left">
                📧 Enter your email to claim your prize (must be a valid VT email):
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => {
                  setUserEmail(e.target.value)
                  setEmailError("") // Clear error when typing
                }}
                placeholder="example@vt.edu"
                className={`w-full px-4 py-3 border-2 rounded-lg font-medium text-gray-800 ${
                  emailError 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-gray-300 bg-white focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors`}
              />
              {emailError && (
                <p className="text-red-600 text-sm font-semibold text-left">⚠️ {emailError}</p>
              )}
            </div>
            
            <button
              onClick={handleClaimClick}
              disabled={isSaving}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black rounded-xl transition-all transform hover:scale-105 border-4 border-green-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SAVING...
                </div>
              ) : (
                '🎁 CLAIM PRIZE!'
              )}
            </button>
            
            <p className="text-xs text-gray-600 font-semibold bg-blue-50 border border-blue-200 rounded-lg p-3">
              💌 <strong>We will reach out to you via email for your compensation.</strong> 
              <br />
              Please check your inbox within 24-48 hours for prize details and next steps.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={handleClaimClick}
              disabled={isSaving}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-xl transition-all transform hover:scale-105 border-4 border-blue-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SAVING...
                </div>
              ) : (
                '📚 GO BACK TO CONCEPTS'
              )}
            </button>
            <p className="text-xs text-gray-600 font-semibold bg-blue-50 border border-blue-200 rounded-lg p-3">
              🎓 <strong>Earn more spins by completing lessons!</strong> 
              <br />
              Each completed lesson gives you another chance at the prize wheel.
            </p>
          </>
        )}
      </div>
    </>
  )
}