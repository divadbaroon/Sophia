export interface ConsentModalProps {
  isOpen?: boolean
  onClose?: () => void
  onConsent: (hasConsented: boolean) => Promise<void>
  isProcessing?: boolean
}