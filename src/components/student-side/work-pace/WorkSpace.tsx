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
import { HelpCircle, X, MessageCircle, Clock } from "lucide-react";
import { useFile } from "@/lib/context/FileContext";
import KnowledgeRadarModal from "@/components/student-side/student-report/studentReport"; 

export const WorkspaceLayout = () => {
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false);
  const [isTAModalOpen, setIsTAModalOpen] = useState(false);
  const [blinkingState, setBlinkingState] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(50);
  const [isKnowledgeRadarModalOpen, setIsKnowledgeRadarModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  // Destructure additional properties from FileContext
  const {
    updateStudentTask,
    sessionData,
    sessionId,
    currentMethodIndex,
    showReport,
    studentTask,
    fileContent,
    conversationHistory,
    conceptMap,
  } = useFile();

  const codeEditorRef = useRef<CodeEditorRef>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize timer from localStorage
  useEffect(() => {
    if (sessionId) {
      const timerKey = `knowledgeTimer_${sessionId}_${currentMethodIndex}`;
      const storedTime = localStorage.getItem(timerKey);
      const storedStartTime = localStorage.getItem(`${timerKey}_start`);
      
      if (storedTime && storedStartTime) {
        const elapsedSeconds = Math.floor((Date.now() - parseInt(storedStartTime)) / 1000);
        const remainingTime = Math.max(0, parseInt(storedTime) - elapsedSeconds);
        
        setTimeRemaining(remainingTime);
        if (remainingTime > 0) {
          setTimerActive(true);
        }
      }
    }
  }, [sessionId, currentMethodIndex]);

  // Timer logic
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If timer is active and time remaining, start countdown
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          
          // Save to localStorage
          if (sessionId) {
            const timerKey = `knowledgeTimer_${sessionId}_${currentMethodIndex}`;
            localStorage.setItem(timerKey, newTime.toString());
          }
          
          // Stop timer if we reach zero
          if (newTime === 0) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setTimerActive(false);
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining, sessionId, currentMethodIndex]);

  // Start timer when task changes
  useEffect(() => {
    if (sessionId && currentMethodIndex >= 0) {
      const timerKey = `knowledgeTimer_${sessionId}_${currentMethodIndex}`;
      
      // Check if timer already exists for this task
      if (!localStorage.getItem(timerKey)) {
        // Initialize timer
        setTimeRemaining(600); // 10 minutes
        setTimerActive(true);
        
        // Save start time
        localStorage.setItem(timerKey, "600");
        localStorage.setItem(`${timerKey}_start`, Date.now().toString());
      }
    }
  }, [sessionId, currentMethodIndex]);

  useEffect(() => {
    console.log("KnowledgeRadarModal received conceptMap:", conceptMap);
  }, [conceptMap]);

  useEffect(() => {
    console.log("conversationHistory received conceptMap:", conversationHistory);
  }, [conversationHistory]);

  // TA office hours Zoom link
  const taZoomLink = "https://zoom.us/j/123456789?pwd=examplepassword";

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

        if (currentTask.constraints && currentTask.constraints.length > 0) {
          taskDescription += "\n\nConstraints:";
          currentTask.constraints.forEach((constraint) => {
            taskDescription += `\n- ${constraint}`;
          });
        }
      }

      updateStudentTask(taskDescription);
    }
  }, [sessionData, currentMethodIndex, updateStudentTask, sessionId]);

  // Set up blinking effect when confidence threshold is met
  useEffect(() => {
    if (showReport) {
      setBlinkingState(true);
      const blinkInterval = setInterval(() => {
        setBlinkingState((prev) => !prev);
      }, 500);
  
      const stopBlinkTimeout = setTimeout(() => {
        clearInterval(blinkInterval);
        setBlinkingState(false);
      }, 5000);
  
      return () => {
        clearInterval(blinkInterval);
        clearTimeout(stopBlinkTimeout);
      };
    }
  }, [showReport]);

  // Function to update terminal height
  const updateTerminalHeight = (newHeight: number) => {
    const limitedHeight = Math.min(Math.max(newHeight, 5), 70);
    setTerminalHeight(limitedHeight);
  };

  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex flex-col h-screen">
      <div className="flex-1 flex relative">
        {/* Knowledge Gap Discovery Button with Timer */}
        <Button
          variant="outline"
          size="lg"
          className={`absolute top-3.5 right-56 mr-6 z-50 gap-2 font-medium ${
            isQuestionPanelVisible ? 'bg-secondary' : 
            timeRemaining === 0 ? 'bg-background hover:bg-secondary/80' : 'bg-secondary/30 cursor-not-allowed'
          }`}
          onClick={() => {
            if (timeRemaining === 0) {
              setIsQuestionPanelVisible(!isQuestionPanelVisible);
              if (isTAModalOpen) {
                setIsTAModalOpen(false);
              }
            }
          }}
          disabled={timeRemaining > 0}
          title={timeRemaining > 0 ? "Please complete your attempt before requesting assistance" : "Start conversation with ATLAS"}
        >
          {timeRemaining === 0 ? (
            <>
              <HelpCircle className="h-5 w-5" />
              {isQuestionPanelVisible ? 'End Session' : 'Test My Understanding'}
            </>
          ) : (
            <>
              <Clock className="h-5 w-5" />
              {`Available in ${formatTime(timeRemaining)}`}
            </>
          )}
        </Button>

        {/* View Report Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            if (showReport) {
              // Close the question panel if it's open
              if (isQuestionPanelVisible) {
                setIsQuestionPanelVisible(false);
              }
              // Close the TA modal if it's open
              if (isTAModalOpen) {
                setIsTAModalOpen(false);
              }
              // Open the report modal
              setIsKnowledgeRadarModalOpen(true);
            }
          }}
          title={
            !showReport
              ? "System has not reached enough confidence to show report yet"
              : ""
          }
          className={`absolute top-3.5 right-16 mr-3 z-50 gap-2 font-medium ${
            !showReport
              ? "bg-amber-100 hover:bg-amber-100 text-amber-800 cursor-not-allowed opacity-70"
              : `bg-amber-500 hover:bg-amber-600 cursor-pointer ${blinkingState ? "animate-pulse" : ""}`
          }`}
        >
          <>
            <MessageCircle className="h-5 w-5" />
            View Report
          </>
        </Button>

        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
            <PanelWithHeader>
              <TaskSidebar />
            </PanelWithHeader>
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

              {/* Terminal - Fixed at bottom with controlled height */}
              <div
                className="absolute left-0 right-0 bottom-0 bg-background"
                style={{ height: `${terminalHeight}%` }}
              >
                <Terminal />
              </div>

              {/* Question Panel Popup */}
              {isQuestionPanelVisible && (
                <Card className="absolute top-14 right-4 w-[400px] z-50 shadow-lg mt-6 mr-1">
                  <QuestionPanelWrapper editorRef={codeEditorRef} />
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

                  <p className="mb-4">
                    Your code understanding has reached the threshold to receive direct
                    assistance. Use the Zoom link below to join the TA&apos;s office hours:
                  </p>

                  <div className="bg-slate-50 p-3 rounded-md mb-4 border border-slate-200 font-mono text-sm break-all">
                    {taZoomLink}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setIsTAModalOpen(false)}>
                      Close
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => {
                        window.open(taZoomLink, "_blank");
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
      {/* Render the Knowledge Radar Modal with the additional props */}
      {isKnowledgeRadarModalOpen && (
        <KnowledgeRadarModal
          isOpen={isKnowledgeRadarModalOpen}
          onClose={() => setIsKnowledgeRadarModalOpen(false)}
          studentTask={studentTask}
          code={fileContent}
          conversationHistory={conversationHistory}
          conceptMap={conceptMap}
        />
      )}
    </main>
  );
};

export default WorkspaceLayout;