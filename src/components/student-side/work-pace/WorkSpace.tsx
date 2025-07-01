'use client'

import React, { useState, useEffect, useRef } from "react"

import { Card } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, Pencil, Trash2 } from "lucide-react"

import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader"
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import CodeEditor from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"
import ConsentModal from "@/components/student-side/consent/ConsentModal"
import SophiaWrapper from "@/components/student-side/voice-chat/wrapper/SophiaWrapper"
import { DeepgramTranscriber } from "@/components/student-side/voice-chat/stt/DeepgramTranscriber"
import { trackSophiaInteraction } from "@/lib/actions/sophia-button-interaction-actions"
import { useSophiaBrain } from "@/components/student-side/voice-chat/hooks/useSophiaBrain"

import { useFile } from "@/lib/context/FileContext" 

import { CodeEditorRef } from "@/types"

const CONSENT_STORAGE_KEY = 'sophia_user_consent'

export const WorkspaceLayout: React.FC = () => {
  const { startTranscription, stopTranscription } = DeepgramTranscriber()

  const { stopAudio } = useSophiaBrain() 

  const { 
    sessionId, 
    lessonId, 
    currentMethodIndex, 
    sessionData, 
    codeLoading,
    executionOutput,
    currentTestCases,
    activeMethodId,
    isTaskCompleted
  } = useFile()

  // Panel & UI state
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentProcessing, setConsentProcessing] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(50)

  // Drawing state to track drawing mode for button styling
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  
  // Visualization state

  // Test case monitoring state
  const [allTestsPassed, setAllTestsPassed] = useState(false)
  const [shouldFlash, setShouldFlash] = useState(false)
  const [flashToggle, setFlashToggle] = useState(false)

  const codeEditorRef = useRef<CodeEditorRef>(null)

  // Check if essential data is loaded
  const isLoading = !sessionData || !sessionId || !lessonId || currentMethodIndex === undefined || codeLoading

  // Get current task info
  const currentTask = sessionData?.tasks?.[currentMethodIndex]
  const currentTaskTitle = currentTask?.title || 'Task'

  // Monitor execution output for test results
  useEffect(() => {
    if (!executionOutput || !currentTestCases || currentTestCases.length === 0) {
      setAllTestsPassed(false)
      return
    }

    // Parse test results from execution output
    // Look for patterns like "Test passed" or "Test failed" or specific test case indicators
    const testPassedMatches = executionOutput.match(/test.*passed/gi) || []
    const testFailedMatches = executionOutput.match(/test.*failed/gi) || []
    const allPassedMatch = executionOutput.match(/all tests passed/gi) || []
    
    // Also check for specific test case patterns (e.g., "✓" or "✗")
    const checkmarkMatches = executionOutput.match(/✓/g) || []
    const crossMatches = executionOutput.match(/✗/g) || []
    
    // Calculate passed tests
    const passedFromMatches = testPassedMatches.length
    const passedFromCheckmarks = checkmarkMatches.length
    const totalTests = currentTestCases.length
    
    // Use the maximum of the different counting methods
    const passedCount = Math.max(passedFromMatches, passedFromCheckmarks)
    
    // Check if all tests passed
    const allPassed = allPassedMatch.length > 0 || 
                     (passedCount === totalTests && totalTests > 0) ||
                     (testFailedMatches.length === 0 && crossMatches.length === 0 && passedCount > 0)
    
    setAllTestsPassed(allPassed)
    
    // Log test results for debugging
    console.log('📋 Test Results:', {
      currentMethod: activeMethodId,
      taskIndex: currentMethodIndex,
      taskTitle: currentTaskTitle,
      totalTests,
      passedCount,
      allPassed,
      isTaskAlreadyCompleted: isTaskCompleted(currentMethodIndex)
    })

    // Start flashing if all tests passed and task isn't already completed
    if (allPassed && !isTaskCompleted(currentMethodIndex)) {
      setShouldFlash(true)
      // Stop flashing after 5 seconds
      const timer = setTimeout(() => setShouldFlash(false), 5000)
      return () => clearTimeout(timer)
    } else {
      setShouldFlash(false)
    }
  }, [executionOutput, currentTestCases, activeMethodId, currentMethodIndex, isTaskCompleted, currentTaskTitle])

  // Consent check on mount
  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (!existing) setShowConsentModal(true)
    } catch {
      setShowConsentModal(true)
    }
  }, [])

  // Flash toggle effect - THIS IS THE MISSING PIECE!
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (shouldFlash) {
      interval = setInterval(() => {
        setFlashToggle(false)
      }, 500) // Toggle every 500ms
    } else {
      setFlashToggle(false)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [shouldFlash])

  const onToggleSophia = () => {
    if (isQuestionPanelVisible) {
      // Closing Sophia
      stopTranscription()
      stopAudio()
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
    stopAudio()
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

  // Handle drawing mode toggle
  const handleToggleDrawing = () => {
    codeEditorRef.current?.toggleDrawing()
    setIsDrawingMode((prev) => !prev)
  }

  // Handle clear drawing
  const handleClearDrawing = () => {
    codeEditorRef.current?.clearDrawing()
  }

  // Determine if buttons should be hidden
  const shouldHideButtons = isQuizModalOpen || isSurveyModalOpen

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
          {/* Drawing Controls - Show when quiz/survey are not open */}
          {!shouldHideButtons && (
            <div className="absolute top-3.5 right-[16rem] z-[9999] flex gap-3 mt-2">
             
              {/* Draw Button */}
              <Button
                variant={isDrawingMode ? "default" : "outline"}
                size="sm"
                className="gap-2 font-medium"
                onClick={handleToggleDrawing}
                disabled={showConsentModal}
                title="Toggle drawing mode on code editor"
              >
                <Pencil className="h-5 w-5" />
                {isDrawingMode ? "Exit Draw" : "Draw"}
              </Button>

              {/* Clear All Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 -mr-3"
                onClick={handleClearDrawing}
                disabled={showConsentModal}
                title="Clear all drawings on code editor"
              >
                <Trash2 className="h-5 w-5" />
                Clear All
              </Button>
            </div>
          )}

          {/* Ask Sophia button with tooltip - now with conditional flashing */}
          {!shouldHideButtons && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="absolute top-3.5 right-16 z-50 flex items-center gap-2"
                    style={{
                      backgroundColor: shouldFlash && flashToggle ? '#fbbf24' : isQuestionPanelVisible ? 'hsl(var(--secondary))' : 'hsl(var(--background))',
                      borderColor: shouldFlash && flashToggle ? '#f59e0b' : undefined,
                      color: shouldFlash && flashToggle ? '#000' : undefined,
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      console.log('🔘 Button clicked - shouldFlash:', shouldFlash, 'flashToggle:', flashToggle)
                      onToggleSophia()
                    }}
                    disabled={showConsentModal}
                  >
                    <HelpCircle className="h-5 w-5" />
                    {isQuestionPanelVisible ? 'Close Sophia' : 'Ask Sophia'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {allTestsPassed && !isTaskCompleted(currentMethodIndex) 
                      ? '🎉 All tests passed! Click to discuss with Sophia' 
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