import { Loader2 } from 'lucide-react'

export const LoadingModal = () => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
      <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
      <h3 className="text-lg font-semibold text-gray-800">Checking prize wheel eligibility...</h3>
      <p className="text-sm text-gray-600 mt-2">Just a moment while we verify your spin.</p>
    </div>
  </div>
)
