"use client";

import { useState, useEffect, useRef } from "react";
import QuestionPanelWrapper from "@/components/student-side/question-panel/QuestionPanelWrapper";
import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader";
import CodeEditor, { CodeEditorRef } from "@/components/student-side/code-editor/CodeEditor";
import Terminal from "@/components/student-side/terminal/Terminal";
import { Card } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar";
import { HelpCircle } from "lucide-react";
import { useFile } from "@/lib/context/FileContext";
import ConsentModal from "@/components/student-side/consent/ConsentModal"; 

// Local storage key for consent
const CONSENT_STORAGE_KEY = 'sophia_user_consent';

export const WorkspaceLayout = () => {
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false);
  const [isTAModalOpen, setIsTAModalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(50);
  
  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentProcessing, setConsentProcessing] = useState(false);

  // Destructure additional properties from FileContext
  const {
    updateStudentTask,
    sessionData,
    sessionId,
    currentMethodIndex,
    conversationHistory,
    conceptMap,
  } = useFile();

  const codeEditorRef = useRef<CodeEditorRef>(null);

  // Check for existing consent on component mount
  useEffect(() => {
    const checkConsent = () => {
      try {
        const existingConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!existingConsent) {
          // No consent found, show modal
          setShowConsentModal(true);
        }
      } catch (error) {
        console.error('Error checking consent:', error);
        // If localStorage fails, show consent modal to be safe
        setShowConsentModal(true);
      }
    };

    checkConsent();
  }, []);

  // Handle consent response
  const handleConsent = async (hasConsented: boolean) => {
    setConsentProcessing(true);
    
    try {
      // Save consent decision to localStorage
      const consentData = {
        consented: hasConsented,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'unknown'
      };
      
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (hasConsented) {
        // User consented, close modal and continue
        setShowConsentModal(false);
      } 
    } catch (error) {
      console.error('Error saving consent:', error);
      // Handle error appropriately
    } finally {
      setConsentProcessing(false);
    }
  };

  // Handle modal close (decline)
  const handleConsentModalClose = () => {
    // Redirect to home page if user closes modal without consenting
    window.location.href = '/';
  };

  useEffect(() => {
    console.log("KnowledgeRadarModal received conceptMap:", conceptMap);
  }, [conceptMap]);

  useEffect(() => {
    console.log("conversationHistory received conceptMap:", conversationHistory);
  }, [conversationHistory]);

  // Update student task when session data or current method changes
  useEffect(() => {
    if (sessionData && sessionData.tasks) {
      let taskDescription = sessionData.system || "ATLAS";

      if (sessionData.tasks[currentMethodIndex]) {
        const currentTask = sessionData.tasks[currentMethodIndex];
        taskDescription += `\n\n${currentTask.title}\n${currentTask.description}`;

        if (currentTask.examples && currentTask.examples.length > 0) {
          taskDescription += "\n\nExamples:";
          currentTask.examples.forEach((example, index) => {
            taskDescription += `\nExample ${index + 1}: Input: ${JSON.stringify(
              example.input
            )} -> Output: ${example.output}`;
          });
        }
      }

      updateStudentTask(taskDescription);
    }
  }, [sessionData, currentMethodIndex, updateStudentTask, sessionId]);

  // Function to update terminal height
  const updateTerminalHeight = (newHeight: number) => {
    const limitedHeight = Math.min(Math.max(newHeight, 5), 70);
    setTerminalHeight(limitedHeight);
  };

  return (
    <>
      {/* Consent Modal */}
      {showConsentModal && (
        <ConsentModal
          isOpen={showConsentModal}
          onClose={handleConsentModalClose}
          onConsent={handleConsent}
          isProcessing={consentProcessing}
        />
      )}

      {/* Main Workspace */}
      <main className={`flex flex-col h-screen ${showConsentModal ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="flex-1 flex relative">
          {/* Knowledge Gap Discovery Button */}
          <Button
            variant="outline"
            size="lg"
            className={`absolute top-3.5 right-16 mr-6 z-40 gap-2 font-medium ${
              isQuestionPanelVisible ? 'bg-secondary' : 'bg-background hover:bg-secondary/80'
            }`}
            onClick={() => {
              setIsQuestionPanelVisible(!isQuestionPanelVisible);
              if (isTAModalOpen) {
                setIsTAModalOpen(false);
              }
            }}
            disabled={showConsentModal}
            title="Start conversation with ATLAS"
          >
            <HelpCircle className="h-5 w-5" />
            {isQuestionPanelVisible ? 'Close' : 'Get Help'}
          </Button>

          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40} className="flex flex-col">
              {/* TaskSidebar*/}
              <div className="h-full">
                <TaskSidebar />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70}>
              <div className="relative h-full">
                <div className="absolute inset-0 -mt-2">
                  <PanelWithHeader>
                    <CodeEditor ref={codeEditorRef} />
                  </PanelWithHeader>
                </div>

                {/* Custom drag handle for the terminal */}
                <div
                  className="absolute left-0 right-0 h-2 bg-gray-100 hover:bg-gray-200 cursor-ns-resize z-10"
                  style={{
                    bottom: `${terminalHeight}%`,
                    marginBottom: "-4px",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startY = e.clientY;
                    const startHeight = terminalHeight;
                    const containerHeight =
                      e.currentTarget.parentElement?.clientHeight || 0;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaY = startY - moveEvent.clientY;
                      const deltaPercent = (deltaY / containerHeight) * 100;
                      const newHeight = startHeight + deltaPercent;
                      updateTerminalHeight(newHeight);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove);
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                />

                {/* Terminal */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-background"
                  style={{ height: `${terminalHeight}%` }}
                >
                  <Terminal />
                </div>

                {/* Question Panel Popup */}
                {isQuestionPanelVisible && !showConsentModal && (
                  <Card className="absolute top-14 right-4 w-[400px] z-40 shadow-lg mt-6 mr-1">
                    <QuestionPanelWrapper editorRef={codeEditorRef} />
                  </Card>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
    </>
  );
};

export default WorkspaceLayout;