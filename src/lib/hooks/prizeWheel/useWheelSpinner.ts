import { useState, useEffect, useRef, useCallback } from 'react'
import { Wheel, WheelItem, WheelEvent } from 'spin-wheel'

interface UseWheelSpinnerProps {
  isOpen: boolean
  isEligible: boolean
  showResult: boolean
  prizes: WheelItem[]
  onPrizeWon: (prize: string) => void
  onAutoSave?: (prize: string) => Promise<void>
}

export const useWheelSpinner = ({
  isOpen,
  isEligible,
  showResult,
  prizes,
  onPrizeWon,
  onAutoSave
}: UseWheelSpinnerProps) => {
  const wheelContainerRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<Wheel | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null)

  // Load overlay image
  useEffect(() => {
    const img = new Image()
    img.onload = () => setOverlayImage(img)
    img.onerror = () => setOverlayImage(null)
    img.src = '/images/prizeWheel/wheel-overlay.svg'
  }, [])

  // Stable callback refs to prevent wheel recreation
  const onPrizeWonRef = useRef(onPrizeWon)
  const onAutoSaveRef = useRef(onAutoSave)

  // Update refs when callbacks change
  useEffect(() => {
    onPrizeWonRef.current = onPrizeWon
  }, [onPrizeWon])

  useEffect(() => {
    onAutoSaveRef.current = onAutoSave
  }, [onAutoSave])

  // Stable onRest callback
  const handleWheelRest = useCallback(async (event: WheelEvent) => {
    setIsSpinning(false)
    
    if (event.currentIndex !== undefined) {
      const winningItem = prizes[event.currentIndex]
      const winnerLabel = winningItem.label || "Unknown Prize"
      
      onPrizeWonRef.current(winnerLabel)
      
      // Auto-save non-winning prizes
      if (winnerLabel.includes("TRY AGAIN") && onAutoSaveRef.current) {
        try {
          await onAutoSaveRef.current(winnerLabel)
        } catch (error) {
          console.error('Error auto-saving prize:', error)
        }
      }
    }
  }, [prizes]) // Only depend on prizes

  // Initialize wheel
  useEffect(() => {
    // Only create wheel if conditions are met and wheel doesn't exist
    if (isOpen && isEligible && !showResult && wheelContainerRef.current && !wheelRef.current) {
      
      try {
        wheelRef.current = new Wheel(wheelContainerRef.current, {
          items: prizes,
          radius: 0.84,
          itemLabelRadius: 0.93,
          itemLabelRadiusMax: 0.35,
          itemLabelRotation: 180,
          itemLabelAlign: 'left',
          itemLabelColors: ['#fff'],
          itemLabelBaselineOffset: -0.07,
          itemLabelFont: 'Arial Black, Arial, sans-serif',
          itemLabelFontSizeMax: 28,
          itemBackgroundColors: [
            '#ffc93c', '#66bfbf', '#a2d5f2', '#515070', 
            '#43658b', '#ed6663', '#d54062'
          ],
          rotationSpeedMax: 500,
          rotationResistance: -100,
          lineWidth: 1,
          lineColor: '#fff',
          borderWidth: 3,
          borderColor: '#000',
          overlayImage: overlayImage || undefined,
          pointerAngle: 90,
          onRest: handleWheelRest // Use stable callback
        })
        
      } catch (error) {
        console.error('❌ Error initializing wheel:', error)
        setIsSpinning(false) // Reset spinning state on error
      }
    }
  }, [isOpen, isEligible, showResult, overlayImage, prizes, handleWheelRest])

  // Clean up wheel when needed
  useEffect(() => {
    if (showResult || !isOpen || !isEligible) {
      if (wheelRef.current) {
        try {
          wheelRef.current.remove()
          wheelRef.current = null
        } catch (error) {
          console.error('Error removing wheel:', error)
        }
      }
    }

    return () => {
      if (wheelRef.current) {
        try {
          wheelRef.current.remove()
          wheelRef.current = null
        } catch (error) {
          console.error('Error removing wheel:', error)
        }
      }
    }
  }, [showResult, isOpen, isEligible])

  const handleSpin = useCallback(() => {
    if (!wheelRef.current || isSpinning) {
      return
    }
    
    setIsSpinning(true)

    try {
      const duration = 3000
      const randomRotation = Math.random() * 360 + 360 * 3
      wheelRef.current.spinTo(randomRotation, duration)
    } catch (error) {
      console.error('❌ Error spinning wheel:', error)
      setIsSpinning(false)
    }
  }, [isSpinning])

  return {
    wheelContainerRef,
    isSpinning,
    handleSpin
  }
}