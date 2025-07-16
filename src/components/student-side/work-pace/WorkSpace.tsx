'use client'

import React, { useState, useEffect, useRef } from "react"

import { Card } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader"
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import CodeEditor from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"
import ConsentModal from "@/components/student-side/consent/ConsentModal"
import SophiaConversationalAI from '@/components/student-side/voice-chat/elevenlabs/SophiaConversationalAI'

import { trackSophiaInteraction } from "@/lib/actions/sophia-button-interaction-actions"

import { useSession } from "@/lib/context/session/SessionProvider"
import { useCodeEditor } from "@/lib/context/codeEditor/CodeEditorProvider"

import { CodeEditorRef } from "@/types"

const CONSENT_STORAGE_KEY = 'sophia_user_consent'

export const WorkspaceLayout: React.FC = () => {
  const { sessionId, lessonId, currentMethodIndex, sessionData } = useSession()
  const { codeLoading } = useCodeEditor()

  // Panel & UI state
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentProcessing, setConsentProcessing] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false)
  const [showKnowledgeRadar, setShowKnowledgeRadar] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(50)
  
  
  // Initialization tooltip state
  const [showInitTooltip, setShowInitTooltip] = useState(false)
  
  const codeEditorRef = useRef<CodeEditorRef>(null)

  // Check if essential data is loaded
  const isLoading = !sessionData || !sessionId || !lessonId || currentMethodIndex === undefined || codeLoading

  // Calculate button positioning
  const sophiaButtonText = isQuestionPanelVisible ? 'Close Sophia' : 'Ask Sophia'

  // Initialize tooltip on component mount (after loading is complete)
  useEffect(() => {
    if (!isLoading && !showConsentModal) {
      // Show the tooltip after a short delay to ensure everything is rendered
      const timer = setTimeout(() => {
        setShowInitTooltip(true)
        
        // Auto-hide the tooltip after 5 seconds
        const hideTimer = setTimeout(() => {
          setShowInitTooltip(false)
        }, 5000)
        
        return () => clearTimeout(hideTimer)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isLoading, showConsentModal])

  // Consent check on mount
  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (!existing) setShowConsentModal(true)
    } catch {
      setShowConsentModal(true)
    }
  }, [])

  const onToggleSophia = () => {
    // Hide the init tooltip when user interacts with the button
    setShowInitTooltip(false)
    
    if (isQuestionPanelVisible) {
      // Closing Sophia
      setIsQuestionPanelVisible(false)
      
      // Track close interaction in background 
      if (sessionId && lessonId) {
        trackSophiaInteraction({
          sessionId,
          lessonId,
          currentTaskIndex: currentMethodIndex,
          interactionType: 'close'
        }).catch(error => {
          console.error('Failed to track Sophia close interaction:', error)
        })
      }
    } else {
      // Opening Sophia
      setIsQuestionPanelVisible(true)
      
      // Track open interaction in background 
      if (sessionId && lessonId) {
        trackSophiaInteraction({
          sessionId,
          lessonId,
          currentTaskIndex: currentMethodIndex,
          interactionType: 'open'
        }).catch(error => {
          console.error('Failed to track Sophia open interaction:', error)
        })
      }
    }
  }

  // Close handler 
  const onCloseSophia = () => {
    setIsQuestionPanelVisible(false)
    
    // Track close interaction from wrapper 
    if (sessionId && lessonId) {
      trackSophiaInteraction({
        sessionId,
        lessonId,
        currentTaskIndex: currentMethodIndex,
        interactionType: 'close'
      }).catch(error => {
        console.error('Failed to track Sophia close interaction from wrapper:', error)
      })
    }
  }

  // Terminal resize handler
  const updateTerminalHeight = (newHeight: number) => {
    setTerminalHeight(Math.min(Math.max(newHeight, 5), 70))
  }

  // Determine if buttons should be hidden
  const shouldHideButtons = isQuizModalOpen || isSurveyModalOpen || showKnowledgeRadar

  // Show global loading state
  if (isLoading) {
    return (
      <>
        {showConsentModal && (
          <ConsentModal
            isOpen={showConsentModal}
            onClose={() => window.location.href = '/'}
            onConsent={async (ok) => {
              setConsentProcessing(true)
              localStorage.setItem(
                CONSENT_STORAGE_KEY,
                JSON.stringify({ consented: ok, timestamp: new Date().toISOString() })
              )
              setConsentProcessing(false)
              if (ok) setShowConsentModal(false)
            }}
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
      {showConsentModal && (
        <ConsentModal
          isOpen={showConsentModal}
          onClose={() => window.location.href = '/'}
          onConsent={async (ok) => {
            setConsentProcessing(true)
            localStorage.setItem(
              CONSENT_STORAGE_KEY,
              JSON.stringify({ consented: ok, timestamp: new Date().toISOString() })
            )
            setConsentProcessing(false)
            if (ok) setShowConsentModal(false)
          }}
          isProcessing={consentProcessing}
        />
      )}

      <main className={`flex flex-col h-screen ${showConsentModal ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="flex-1 flex relative">
          {/* Ask Sophia button */}
          {!shouldHideButtons && (
            <TooltipProvider>
              <Tooltip open={showInitTooltip} onOpenChange={setShowInitTooltip}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="absolute top-3.5 right-16 z-50 flex items-center gap-2 mr-1.5 transition-all duration-200 ease-in-out"
                    style={{
                      backgroundColor: isQuestionPanelVisible ? 'hsl(var(--secondary))' : 'hsl(var(--background))',
                      minWidth: 'fit-content'
                    }}
                    onClick={onToggleSophia}
                    disabled={showConsentModal}
                  >
                    <HelpCircle className="h-5 w-5" />
                    {sophiaButtonText}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>
                    {showInitTooltip 
                      ? '💡 Click here when you need help or get stuck!'
                      : isQuestionPanelVisible 
                        ? 'Close your coding tutor' 
                        : 'Get help from Sophia, your coding tutor'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <TaskSidebar
                isQuizModalOpen={isQuizModalOpen}
                setIsQuizModalOpen={setIsQuizModalOpen}
                isSurveyModalOpen={isSurveyModalOpen}
                setIsSurveyModalOpen={setIsSurveyModalOpen}
                showKnowledgeRadar={showKnowledgeRadar}
                setShowKnowledgeRadar={setShowKnowledgeRadar}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={70}>
              <div className="relative h-full">
                {/* Code editor */}
                <div className="absolute inset-0 -mt-2">
                  <PanelWithHeader>
                    <CodeEditor ref={codeEditorRef} />
                  </PanelWithHeader>
                </div>

                {/* Drag handle for resizing terminal */}
                <div
                  className="absolute left-0 right-0 h-2 bg-gray-100 hover:bg-gray-200 cursor-ns-resize z-10"
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

                {/* Sophia panel */}
                {isQuestionPanelVisible && (
                  <Card className="absolute top-14 right-4 w-[400px] z-40 shadow-lg mt-6 mr-1">
                    <SophiaConversationalAI onClose={onCloseSophia} sessionId={sessionId} classId={lessonId} />
                  </Card>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
    </>
  )
}

export default WorkspaceLayout