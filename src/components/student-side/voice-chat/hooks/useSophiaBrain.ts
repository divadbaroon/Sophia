import { useContext } from 'react'
import { SophiaBrainContext } from '../context/SophiaBrainContext'
import { SophiaBrainController } from '../types/SophiaBrainType'

// Hook to use Sophia's brain
export const useSophiaBrain = (): SophiaBrainController => {
  const context = useContext(SophiaBrainContext)
  if (!context) {
    throw new Error('useSophiaBrain must be used within SophiaBrainProvider')
  }
  return context
}