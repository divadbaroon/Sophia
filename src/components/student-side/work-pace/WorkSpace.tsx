'use client'

import React, { useState } from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import CodeEditor from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"

import ConsentModal from "@/components/student-side/consent/ConsentModal"
import OnboardingModal from "@/components/concepts/components/onboardingModal"
import SurveyModal from "@/components/concepts/components/survey-modal"
import PrizeWheelModal from "@/components/concepts/components/prize-wheel" 

import SophiaConversationalAI from '@/components/student-side/voice-chat/elevenlabs/SophiaConversationalAI'

import { useUserConsent } from '@/lib/hooks/userConsent/useUserConsent'
import { useSophiaButtonInteractionTracking } from '@/lib/hooks/interactionTracking/useSophiaButtonInteractionTracking'

import { useSession } from "@/lib/context/session/SessionProvider"
import { useCodeEditor } from "@/lib/context/codeEditor/CodeEditorProvider"

export const WorkspaceLayout: React.FC = () => {

  const { sessionId, lessonId, currentMethodIndex, sessionData } = useSession()

  const { codeLoading } = useCodeEditor()

  const { 
    showConsentModal, 
    consentProcessing, 
    handleConsent 
  } = useUserConsent()

  const { trackOpen, trackClose } = useSophiaButtonInteractionTracking()

  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false)

  const [showPrizeWheel, setShowPrizeWheel] = useState(false) 
  
  const [terminalHeight, setTerminalHeight] = useState(50)

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false)

  // Derive concept title from session data
  const currentConceptTitle = sessionData?.tasks[currentMethodIndex]?.title || "Lesson Complete"
  
  // Check if essential data is loaded
  const isLoading = !sessionData || !sessionId || !lessonId || currentMethodIndex === undefined || codeLoading

  // Calculate button positioning based on text showing
  const sophiaButtonText = isQuestionPanelVisible ? 'Close Sophia' : 'Ask Sophia'

  const onToggleSophia = () => {
    if (isQuestionPanelVisible) {
      setIsQuestionPanelVisible(false)
      trackClose()
    } else {
      setIsQuestionPanelVisible(true)
      trackOpen()
    }
  }

  const onCloseSophia = () => {
    setIsQuestionPanelVisible(false)
    trackClose()
  }

  // Terminal resize handler
  const updateTerminalHeight = (newHeight: number) => {
    setTerminalHeight(Math.min(Math.max(newHeight, 5), 70))
  }

  const handleUserFinished = () => {
    setIsSurveyModalOpen(true)
  }

  const handleSurveyComplete = () => {
    setIsSurveyModalOpen(false)
    setShowPrizeWheel(true)
  }

  const handlePrizeWon = (prize: string) => {
    console.log("🎉 Prize won:", prize)
  }

  const handlePrizeWheelClose = () => {
    setShowPrizeWheel(false)
    window.location.href = "/classes"
  }

  // Handle consent completion and trigger onboarding
  const handleConsentComplete = async (hasConsented: boolean) => {
    if (hasConsented) {
      // Process the consent first
      await handleConsent(hasConsented)
      // Then show onboarding after consent is processed
      setShowOnboarding(true)
    } else {
      // This will redirect them away
      await handleConsent(hasConsented)
    }
  }

  const handleOnboardingClose = () => {
    setShowOnboarding(false)
  }

  const handleGetStarted = () => {
    setShowOnboarding(false)
    trackOpen()
  }

  // Determine if buttons should be hidden
  const shouldHideButtons = isSurveyModalOpen || showPrizeWheel || showOnboarding || showConsentModal

  // Show global loading state
  if (isLoading) {
    return (
      <>
        {showConsentModal && (
          <ConsentModal
            isOpen={showConsentModal}
            onClose={() => window.location.href = '/'}
            onConsent={handleConsentComplete} 
            isProcessing={consentProcessing}
          />
        )}
        
        <main className={`flex flex-col h-screen ${showConsentModal ? 'pointer-events-none opacity-50' : ''}`}>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-lg text-muted-foreground">Setting up your workspace...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      {/* Consent modal */}
      {showConsentModal && (
        <ConsentModal
          isOpen={showConsentModal}
          onClose={() => window.location.href = '/'}
          onConsent={handleConsentComplete} 
          isProcessing={consentProcessing}
        />
      )}

      {/* Onboarding modal */}
      {!showConsentModal && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
          onGetStarted={handleGetStarted}
        />
      )}

      <main className={`flex flex-col h-screen ${showConsentModal || showOnboarding ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="flex-1 flex relative">
          {/* Ask Sophia button */}
          {!shouldHideButtons && (
            <Button
              variant="outline"
              size="lg"
              className="absolute top-3.5 right-16 z-50 flex items-center gap-2 mr-1.5 transition-all duration-200 ease-in-out"
              style={{
                backgroundColor: isQuestionPanelVisible ? 'hsl(var(--secondary))' : 'hsl(var(--background))',
                minWidth: 'fit-content'
              }}
              onClick={onToggleSophia}
              disabled={showConsentModal || showOnboarding}
            >
              <HelpCircle className="h-5 w-5" />
              {sophiaButtonText}
            </Button> 
          )}

          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <TaskSidebar onUserFinished={handleUserFinished} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={70}>
              <div className="relative h-full">
                {/* Code editor area */}
                <div className="absolute inset-0 -mt-2">
                  <div className="h-full flex flex-col">
                    <div className="h-24 bg-white -mt-1"></div>
                    
                    {/* Code editor */}
                    <div className="flex-1 flex">
                      <div className={`flex-1 transition-all duration-300`}>
                        {/* CodeEditor */}
                        <CodeEditor terminalHeight={terminalHeight} />
                      </div>
                      
                      {/* Sophia panel inside code editor area */}
                      {isQuestionPanelVisible && (
                        <div className="w-80 bg-background border-l shadow-lg">
                          <SophiaConversationalAI 
                            onClose={onCloseSophia} 
                            sessionId={sessionId} 
                            classId={lessonId} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drag handle for resizing terminal */}
                <div
                  className="absolute left-0 right-0 h-2 bg-gray-100 hover:bg-gray-200 cursor-ns-resize z-20"
                  style={{
                    bottom: `${terminalHeight}%`,
                    marginBottom: "-4px",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    const startY = e.clientY
                    const startHeight = terminalHeight
                    const containerHeight = e.currentTarget.parentElement?.clientHeight || 0

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaY = startY - moveEvent.clientY
                      const deltaPercent = (deltaY / containerHeight) * 100
                      updateTerminalHeight(startHeight + deltaPercent)
                    }

                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove)
                      document.removeEventListener("mouseup", handleMouseUp)
                    }

                    document.addEventListener("mousemove", handleMouseMove)
                    document.addEventListener("mouseup", handleMouseUp)
                  }}
                />

                {/* Terminal */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-background"
                  style={{ height: `${terminalHeight}%` }}
                >
                  <Terminal />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>

      <SurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        conceptTitle={currentConceptTitle}
        sessionId={sessionId}        
        lessonId={lessonId}          
        onComplete={handleSurveyComplete}
      />

      <PrizeWheelModal
        isOpen={showPrizeWheel}
        onClose={handlePrizeWheelClose}
        onPrizeWon={handlePrizeWon}
        sessionId={sessionId}     
        lessonId={lessonId}     
      />
    </>
  )
}

export default WorkspaceLayout