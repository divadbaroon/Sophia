'use client'

import { useState } from 'react'
import { Judge0Service } from '@/lib/services/judge0/judge0Service'

export const useCodeExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false)
  const judge0Service = new Judge0Service()

  const executeCode = async (sourceCode: string): Promise<string> => {
    setIsExecuting(true)
    try {
      const result = await judge0Service.executeCode(sourceCode)
      return result
    } finally {
      setIsExecuting(false)
    }
  }

  return {
    executeCode,
    isExecuting
  }
}