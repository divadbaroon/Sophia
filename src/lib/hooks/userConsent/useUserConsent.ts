import { useState, useEffect } from 'react'
import { saveUserConsent, hasUserConsented } from '@/lib/actions/user-consent-actions'

export const useUserConsent = () => {
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentProcessing, setConsentProcessing] = useState(false)

  // Check consent on mount
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const result = await hasUserConsented()
        
        if (!result.success || !result.hasConsented) {
          setShowConsentModal(true)
        }
      } catch (error) {
        console.error('Error checking consent:', error)
        setShowConsentModal(true)
      }
    }
    
    checkConsent()
  }, [])

  // Handle consent submission
  const handleConsent = async (consented: boolean) => {
    setConsentProcessing(true)
    
    try {
      const result = await saveUserConsent(consented)
      
      if (!result.success) {
        console.error('Failed to save consent:', result.error)
        setConsentProcessing(false)
        return
      }
      
      setConsentProcessing(false)
      if (consented) {
        setShowConsentModal(false)
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error saving consent:', error)
      setConsentProcessing(false)
    }
  }

  return {
    showConsentModal,
    setShowConsentModal,
    consentProcessing,
    handleConsent
  }
}