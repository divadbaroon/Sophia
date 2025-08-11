'use client'

import { useState, useEffect, useId, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onGetStarted: () => void
  conceptTitle?: string
}

export default function OnboardingModal({
  isOpen,
  onClose,
  onGetStarted,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  const slides = [
    {
      title: "Meet Sophia",
      subtitle: "Your personal empathetic teaching voice agent, configured and verified by your professor with the goal of supporting you and your learning.",
      hasVideo: true
    },
    {
      title: "Contextual Awareness",
      subtitle: "Sophia sees what you're coding and knows exactly where you are in each task. Highlight specific code you want her to focus on. Jump straight into help without any setup."
    },
    {
      title: "Teaching Style",
      subtitle: "Sophia behaves like a teaching assistant—scaffolding your thinking and guiding you towards self-realization, never just giving the answer. She's here to support your critical thinking, not replace it."
    },
    {
      title: "Validate Your Thinking",
      subtitle: "Feeling confident with your solution? Use Sophia to explain your approach and validate your understanding. Teaching others is one of the best ways to learn!"
    },
    {
      title: "Interactive Visualizations",
      subtitle: "Before coding, you'll complete interactive visualization exercises to build conceptual understanding. Use the drawing tools to demonstrate your knowledge, then click 'Run Tests' to validate your answers."
    }
  ]

  const currentSlide = slides[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === slides.length - 1

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && !isLastStep) setCurrentStep(prev => prev + 1)
      if (e.key === 'ArrowLeft' && !isFirstStep) setCurrentStep(prev => prev - 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose, isFirstStep, isLastStep])

  useEffect(() => {
    if (isOpen) setCurrentStep(0)
  }, [isOpen])

  if (!isOpen) return null

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  const handleNext = () => {
    if (isLastStep) {
      onGetStarted()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      aria-labelledby={titleId}
      aria-modal="true"
      role="dialog"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={panelRef}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl"
      >
        {/* Close button */}
        <div className="absolute top-6 right-6 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content section */}
        <div className="px-8 py-8 text-center space-y-6">
          <div className="space-y-4">
            <h1 id={titleId} className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {currentSlide.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* Video section */}
          {currentSlide.hasVideo && (
            <div className="mb-6">
              <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <video
                  className="w-full h-full object-cover"
                  controls
                  poster="/videos/SophiaDemoThumbnail.png"
                >
                  <source src="/videos/SophiaDemo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 pt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentStep 
                    ? "bg-blue-500 w-6" 
                    : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-center gap-3 pt-4">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="px-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium"
            >
              {isLastStep ? "Get Started" : "Continue"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}