'use client'

import React, { useState, useEffect, useRef } from "react"

import { Card } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader"
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import CodeEditor, { CodeEditorRef } from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"
import ConsentModal from "@/components/student-side/consent/ConsentModal"
import SophiaWrapper from "@/components/student-side/voice-chat/wrapper/SophiaWrapper"
import { DeepgramTranscriber } from "@/components/student-side/voice-chat/stt/DeepgramTranscriber"
import { trackSophiaInteraction } from "@/lib/actions/sophia-button-interaction-actions"

import { useFile } from "@/lib/context/FileContext" 

const CONSENT_STORAGE_KEY = 'sophia_user_consent'

export const WorkspaceLayout: React.FC = () => {
  const { startTranscription, stopTranscription } = DeepgramTranscriber()

  const { sessionId, lessonId, currentMethodIndex } = useFile()

  // Panel & UI state
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentProcessing, setConsentProcessing] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(50)

  const codeEditorRef = useRef<CodeEditorRef>(null)

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
    if (isQuestionPanelVisible) {
      // Closing Sophia
      stopTranscription()
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
      startTranscription()
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
    stopTranscription()
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
          <Button
            variant="outline"
            size="lg"
            className={`absolute top-3.5 right-16 z-50 flex items-center gap-2 ${
              isQuestionPanelVisible ? 'bg-secondary' : 'bg-background hover:bg-secondary/80'
            }`}
            onClick={onToggleSophia}
            disabled={showConsentModal}
          >
            <HelpCircle className="h-5 w-5" />
            {isQuestionPanelVisible ? 'Close Sophia' : 'Ask Sophia'}
          </Button>

          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <TaskSidebar
                isQuizModalOpen={isQuizModalOpen}
                setIsQuizModalOpen={setIsQuizModalOpen}
                isSurveyModalOpen={isSurveyModalOpen}
                setIsSurveyModalOpen={setIsSurveyModalOpen}
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
                    <SophiaWrapper onClose={onCloseSophia} />
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