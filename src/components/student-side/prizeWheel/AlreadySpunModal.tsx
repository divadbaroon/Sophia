import { X } from 'lucide-react'

interface AlreadySpunModalProps {
  onClose: () => void
  onGoBack: () => void
}

export const AlreadySpunModal = ({ onClose, onGoBack }: AlreadySpunModalProps) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-blue-100 rounded-3xl p-8 max-w-lg w-full text-center relative overflow-hidden">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>

      <div className="relative z-10">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            ALREADY SPUN!
          </h2>
          <p className="text-gray-700 font-semibold">
            You&apos;ve already spun the wheel for this lesson
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onGoBack}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-xl transition-all transform hover:scale-105 border-4 border-blue-700 text-lg"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            📚 GO BACK TO CONCEPTS
          </button>

          <p className="text-xs text-gray-600 font-semibold bg-blue-50 border border-blue-200 rounded-lg p-3">
            🎓 <strong>Want another spin?</strong> 
            <br />
            Complete another lesson to earn your next chance at the prize wheel!
          </p>
        </div>
      </div>
    </div>
  </div>
)