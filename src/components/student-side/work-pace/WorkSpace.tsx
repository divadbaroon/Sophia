import { useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import TaskSidebar from "@/components/student-side/task-sidebar/TaskSidebar"
import CodeEditor from "@/components/student-side/code-editor/CodeEditor"
import Terminal from "@/components/student-side/terminal/Terminal"
import MainPanel from "@/components/student-side/main-panel/MainPanel"
import { PanelWithHeader } from "@/components/student-side/utils/PanelWithHeader"
import { Card } from "@/components/ui/card"

import { TaskSidebarProps } from "@/types"

export const WorkspaceLayout = () => {
  const [isMainPanelVisible, setIsMainPanelVisible] = useState(false)

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

  return (
    <main className="flex flex-col h-screen">
      <div className="flex-1 flex relative">
        <Button
          variant="outline"
          size="lg"
          className={`absolute top-3.5 right-16 mr-3 z-50 gap-2 font-medium ${
            isMainPanelVisible ? 'bg-secondary' : 'bg-background hover:bg-secondary/80'
          }`}
          onClick={() => setIsMainPanelVisible(!isMainPanelVisible)}
        >
          <HelpCircle className="h-5 w-5" />
          {isMainPanelVisible ? 'Hide Help' : 'Get Help'}
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
                    <CodeEditor />
                  </PanelWithHeader>
                  
                  {isMainPanelVisible && (
                    <Card className="absolute top-16 right-4 w-[400px] z-50 shadow-lg mt-6 mr-1">
                      <MainPanel />
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