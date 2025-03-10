import { useState, useEffect, useRef } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { HelpCircle, Clock } from "lucide-react"
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import CodeEditor, { CodeEditorRef } from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"
import QuestionPanelWrapper from "@/components/student-side/question-panel/QuestionPanelWrapper"
import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader"
import { Card } from "@/components/ui/card"
import { useFile } from '@/lib/context/FileContext'
import { TaskSidebarProps } from "@/types"

export const WorkspaceLayout = () => {
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false)
  const [helpAvailable, setHelpAvailable] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5 * 5) // 5 minutes in seconds
  const { updateStudentTask } = useFile()
  
  const codeEditorRef = useRef<CodeEditorRef>(null)

  const twoSumTask: TaskSidebarProps = {
    title: "1.) Two Sum",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    examples: [
      {
        input: { nums: [2, 7, 11, 15], target: 9 },
        output: [0, 1]
      },
      {
        input: { nums: [3, 2, 4], target: 6 },
        output: [1, 2],
      },
      {
        input: { nums: [3, 3], target: 6 },
        output: [0, 1],
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
  }

  // Format time as MM:SS
  const formatTime = (seconds: any) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  useEffect(() => {
    // Save the task description to the FileContext
    updateStudentTask(twoSumTask.description)
  }, [updateStudentTask])

  useEffect(() => {
    // Timer for help button availability
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setHelpAvailable(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="flex flex-col h-screen">
      <div className="flex-1 flex relative">
        <Button
          variant="outline"
          size="lg"
          className={`absolute top-3.5 right-16 mr-3 z-50 gap-2 font-medium ${
            isQuestionPanelVisible ? 'bg-secondary' : 
            helpAvailable ? 'bg-background hover:bg-secondary/80' : 'bg-secondary/30 cursor-not-allowed'
          }`}
          onClick={() => helpAvailable && setIsQuestionPanelVisible(!isQuestionPanelVisible)}
          disabled={!helpAvailable}
        >
          {helpAvailable ? (
            <>
              <HelpCircle className="h-5 w-5" />
              {isQuestionPanelVisible ? 'Hide Help' : 'Get Help'}
            </>
          ) : (
            <>
              <Clock className="h-5 w-5" />
              {`Help in ${formatTime(timeRemaining)}`}
            </>
          )}
        </Button>

        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20}>
            <PanelWithHeader>
              <TaskSidebar {...twoSumTask} />
            </PanelWithHeader>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <div className="relative h-full">
                  <PanelWithHeader>
                    <CodeEditor ref={codeEditorRef} />
                  </PanelWithHeader>
                  
                  {isQuestionPanelVisible && (
                    <Card className="absolute top-16 right-4 w-[400px] z-50 shadow-lg mt-6 mr-1">
                      <QuestionPanelWrapper editorRef={codeEditorRef} />
                    </Card>
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={10}>
                <Terminal />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}