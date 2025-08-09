import { AlertCircle } from 'lucide-react'

interface ErrorModalProps {
  error: string
  onClose: () => void
}

export const ErrorModal = ({ error, onClose }: ErrorModalProps) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Access Prize Wheel</h3>
      <p className="text-sm text-gray-600 mb-4">{error}</p>
      <button
        onClick={onClose}
        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
      >
        Close
      </button>
    </div>
  </div>
)
