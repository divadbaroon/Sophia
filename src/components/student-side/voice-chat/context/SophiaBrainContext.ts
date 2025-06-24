import { createContext } from 'react'
import { SophiaBrainController } from '../types/SophiaBrainType'

// Create context
export const SophiaBrainContext = createContext<SophiaBrainController | null>(null)