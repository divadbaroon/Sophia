'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { CreateSessionFormData } from '@/types'
import { createSession } from '@/lib/actions/sessions'

export function useCreateSession() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [formData, setFormData] = useState<CreateSessionFormData>({
    name: '',
    course: {
      id: '',
      name: '',
      code: ''
    },
    description: '',
    date: '',
    duration: 60,
    location: {
      type: 'physical',
      details: ''
    }
  })

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleInputChange = (field: keyof CreateSessionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLocationChange = (type: 'physical' | 'virtual' | 'hybrid') => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        type
      }
    }))
  }

  const handleSubmit = async () => {
    try {
      if (!isAuthenticated) {
        setError('You must be logged in to create a session')
        return
      }

      setIsLoading(true)
      setError(null)

      const result = await createSession(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Failed to create session')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    isLoading,
    error,
    isAuthenticated,
    handleInputChange,
    handleLocationChange,
    handleSubmit
  }
}