import React from 'react'

interface WheelSpinnerProps {
  wheelContainerRef: React.RefObject<HTMLDivElement | null>  
  isSpinning: boolean
  onSpin: () => void
}

export const WheelSpinner = ({ wheelContainerRef, isSpinning, onSpin }: WheelSpinnerProps) => (
  <>
    <div className="mb-5">
      <div className="text-6xl mb-4">🎁</div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">TIME TO SPIN!</h2>
      <p className="text-gray-600 font-semibold">Thank you for your participation. Now claim your free spin!</p>
    </div>

    {/* Wheel Container */}
    <div className="mb-8 flex justify-center">
      <div className="relative">
        <div 
          ref={wheelContainerRef}
          className="wheel-container prize-wheel"
          style={{ width: '400px', height: '400px' }}
        />
      </div>
    </div>

    {/* Spin Button */}
    <button
      onClick={onSpin}
      disabled={isSpinning}
      className={`px-10 py-5 rounded-xl text-white font-black text-xl transition-all transform hover:scale-105 shadow-xl border-4 -mt-4 ${
        isSpinning 
          ? 'bg-gray-400 border-gray-500 cursor-not-allowed' 
          : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-orange-600'
      }`}
      style={{ 
        fontFamily: 'Arial Black, Arial, sans-serif',
        letterSpacing: '1px'
      }}
    >
      {isSpinning ? (
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          SPINNING...
        </div>
      ) : (
        '🎯 SPIN!'
      )}
    </button>

    <div className="text-sm text-gray-600 space-y-2 mt-8 font-semibold">
      <p>🏆 PRIZES: GIFT CARDS & MORE!</p>
    </div>
  </>
)