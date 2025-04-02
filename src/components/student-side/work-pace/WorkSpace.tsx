import { useState, useEffect, useRef } from 'react'

import QuestionPanelWrapper from "@/components/student-side/question-panel/QuestionPanelWrapper"
import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader"

import CodeEditor, { CodeEditorRef } from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"

import { Card } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import { HelpCircle, MessageCircle, X } from "lucide-react"

import { useFile } from '@/lib/context/FileContext'
import { textAnalyzerClassData } from "@/lib/data/student_tasks"

export const WorkspaceLayout = () => {
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false)
  const [isTAModalOpen, setIsTAModalOpen] = useState(false)
  const [currentMethodIndex, setCurrentMethodIndex] = useState(0)
  const [blinkingState, setBlinkingState] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(50)
  
  const { updateStudentTask, conceptMapConfidenceMet } = useFile()
  
  const codeEditorRef = useRef<CodeEditorRef>(null)

  const methodIds = [
    'count_words',
    'format_text',
    'create_word_filter',
    'word_stats'
  ]

  const currentMethodId = methodIds[currentMethodIndex]

  // TA office hours Zoom link
  const taZoomLink = "https://zoom.us/j/123456789?pwd=examplepassword"

  useEffect(() => {
    updateStudentTask(textAnalyzerClassData.description)
  }, [updateStudentTask])

  // Set up blinking effect when confidence threshold is first met
  useEffect(() => {
    if (conceptMapConfidenceMet) {
      // Start blinking effect
      const blinkInterval = setInterval(() => {
        setBlinkingState(prev => !prev)
      }, 500) // Blink every 500ms

      // Stop blinking after 5 seconds
      const stopBlinkTimeout = setTimeout(() => {
        clearInterval(blinkInterval)
        setBlinkingState(false)
      }, 5000)

      return () => {
        clearInterval(blinkInterval)
        clearTimeout(stopBlinkTimeout)
      }
    }
  }, [conceptMapConfidenceMet])

  // Navigate between methods
  const handlePrevMethod = () => {
    if (currentMethodIndex > 0) {
      setCurrentMethodIndex(currentMethodIndex - 1)
    }
  }
  
  const handleNextMethod = () => {
    if (currentMethodIndex < methodIds.length - 1) {
      setCurrentMethodIndex(currentMethodIndex + 1)
    }
  }

  // Handle TA button click
  const handleTAButtonClick = () => {
    if (conceptMapConfidenceMet) {
      // Close question panel if open
      if (isQuestionPanelVisible) {
        setIsQuestionPanelVisible(false)
      }
      
      // Open TA modal
      setIsTAModalOpen(true)
    }
  }

  // Function to update terminal height
  const updateTerminalHeight = (newHeight: number) => {
    const limitedHeight = Math.min(Math.max(newHeight, 5), 70);
    setTerminalHeight(limitedHeight);
  };

  return (
    <main className="flex flex-col h-screen">
      <div className="flex-1 flex relative">
        {/* Get Help Button */}
        <Button
          variant="outline"
          size="lg"
          className={`absolute top-3.5 right-16 mr-6 z-50 gap-2 font-medium ${
            isQuestionPanelVisible ? 'bg-secondary' : 
            'bg-background hover:bg-secondary/80' 
          }`}
          onClick={() => {
            setIsQuestionPanelVisible(!isQuestionPanelVisible)
            // Close TA modal if open
            if (isTAModalOpen) {
              setIsTAModalOpen(false)
            }
          }}
        >
          <>
            <HelpCircle className="h-5 w-5" />
            {isQuestionPanelVisible ? 'End Session' : 'Map My Understanding'}
          </>
        </Button>

        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
            <PanelWithHeader>
              <TaskSidebar 

              />
            </PanelWithHeader>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
=            <div className="relative h-full">
              <div className="absolute inset-0 -mt-7">
                <PanelWithHeader>
                  <CodeEditor 
                    ref={codeEditorRef}
                  />
                </PanelWithHeader>
              </div>
              
              {/* Custom drag handle */}
              <div 
                className="absolute left-0 right-0 h-2 bg-gray-100 hover:bg-gray-200 cursor-ns-resize z-10"
                style={{ 
                  bottom: `${terminalHeight}%`,
                  marginBottom: '-4px' 
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  
                  const startY = e.clientY;
                  const startHeight = terminalHeight;
                  const containerHeight = e.currentTarget.parentElement?.clientHeight || 0;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaY = startY - moveEvent.clientY;
                    const deltaPercent = (deltaY / containerHeight) * 100;
                    const newHeight = startHeight + deltaPercent;
                    updateTerminalHeight(newHeight);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              
              {/* Terminal - Fixed at bottom with controlled height */}
              <div 
                className="absolute left-0 right-0 bottom-0 bg-background"
                style={{ height: `${terminalHeight}%` }}
              >
                <Terminal />
              </div>
              
              {/* Question Panel Popup */}
              {isQuestionPanelVisible && (
                <Card className="absolute top-9 right-4 w-[400px] z-50 shadow-lg mt-6 mr-1">
                  <QuestionPanelWrapper 
                    editorRef={codeEditorRef}
                  />
                </Card>
              )}
              
              {/* TA Zoom Link Modal */}
              {isTAModalOpen && (
                <Card className="absolute top-9 right-4 w-[400px] z-50 shadow-lg mt-6 mr-1 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Connect with a TA</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsTAModalOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="mb-4">Your code understanding has reached the threshold to receive direct assistance. Use the Zoom link below to join the TA's office hours:</p>
                  
                  <div className="bg-slate-50 p-3 rounded-md mb-4 border border-slate-200 font-mono text-sm break-all">
                    {taZoomLink}
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsTAModalOpen(false)}
                    >
                      Close
                    </Button>
                    
                    <Button 
                      variant="default"
                      onClick={() => {
                        window.open(taZoomLink, '_blank');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Join Zoom Meeting
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}