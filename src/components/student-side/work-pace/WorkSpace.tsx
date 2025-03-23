import { useState, useEffect, useRef } from 'react'

import QuestionPanelWrapper from "@/components/student-side/question-panel/QuestionPanelWrapper"
import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader"

import CodeEditor, { CodeEditorRef } from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"

import { Card } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import { HelpCircle } from "lucide-react"

import { useFile } from '@/lib/context/FileContext'

import { twoSumTask } from "@/lib/data/student_tasks"

export const WorkspaceLayout = () => {
  const [isQuestionPanelVisible, setIsQuestionPanelVisible] = useState(false)
  const [helpAvailable, setHelpAvailable] = useState(true)
  const { updateStudentTask } = useFile()
  
  const codeEditorRef = useRef<CodeEditorRef>(null)

  useEffect(() => {
    updateStudentTask(twoSumTask.description)
  }, [updateStudentTask])

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
          onClick={() => setIsQuestionPanelVisible(!isQuestionPanelVisible)}
        >
         <>
            <HelpCircle className="h-5 w-5" />
            {isQuestionPanelVisible ? 'Hide Help' : 'Get Help'}
          </>
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