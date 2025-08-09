"use client"

import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, ArrowRight, Target, CheckCircle, Lock } from "lucide-react"

import { completeLessonProgress } from "@/lib/actions/learning-session-actions"
import { trackNavigation } from "@/lib/actions/sidebar-navigation-actions"

import { useTaskProgress } from "@/lib/hooks/taskProgress/useTaskProgress"

import { useSession } from "@/lib/context/session/SessionProvider"

import { conceptIcons } from "@/lib/constants/conceptIcons"

import { TaskSidebarProps } from "@/components/student-side/task-sidebar/types"

export default function TaskSidebar({ 
  onUserFinished
}: TaskSidebarProps) {

  const {
    sessionData,
    currentMethodIndex,
    goToNextMethod,
    goToPrevMethod,
    sessionId,
    lessonId,
    completedTasks  
  } = useSession()

  // Task progress state 
  const { isTaskCompleted } = useTaskProgress(sessionId)

  // Check if current task is completed
  const isCurrentTaskCompleted = completedTasks.has(currentMethodIndex) || isTaskCompleted(currentMethodIndex)

  // Navigation handlers with tracking
  const handleNextClick = () => {
    if (!sessionData || !sessionId || !lessonId) return
    
    const fromTaskIndex = currentMethodIndex
    const toTaskIndex = currentMethodIndex + 1
    
    // Move to next task
    goToNextMethod()
    
    // Track navigation in background 
    trackNavigation({
      sessionId,
      lessonId,
      fromTaskIndex,
      toTaskIndex,
      navigationDirection: 'next'
    }).catch(error => {
      console.error('Failed to track next navigation:', error)
    })
  }

  const handlePreviousClick = () => {
    if (!sessionData || !sessionId || !lessonId || currentMethodIndex === 0) return
    
    const fromTaskIndex = currentMethodIndex
    const toTaskIndex = currentMethodIndex - 1
    
    // Move back a task
    goToPrevMethod()
    
    // Track navigation in background 
    trackNavigation({
      sessionId,
      lessonId,
      fromTaskIndex,
      toTaskIndex,
      navigationDirection: 'previous'
    }).catch(error => {
      console.error('Failed to track previous navigation:', error)
    })
  }

  const handleFinishedClick = async () => {
    if (!sessionData || !sessionData.tasks) {
      console.warn('Session data not available')
      return
    }

    if (currentMethodIndex === sessionData.tasks.length - 1 && isCurrentTaskCompleted) {
      // Complete lesson progress
      if (lessonId) {
        try {
          console.log('📝 Updating lesson progress...', { lessonId })
          const result = await completeLessonProgress(lessonId)
          
          if (result.success) {
            console.log('✅ Lesson completed successfully!', result.data)
          } else {
            console.error('❌ Failed to update lesson progress:', result.error)
          }
        } catch (error) {
          console.error('❌ Error updating lesson progress:', error)
        }
      }
      
      // User explicitly finished 
      onUserFinished()
    } else {
      handleNextClick() 
    }
  }

  const currentTask = sessionData?.tasks[currentMethodIndex]
  const concepts = sessionData?.conceptMappings[currentMethodIndex] || []

  if (!sessionData || !currentTask) {
    return null
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/20 transition-all duration-300 relative">
        {/* Header */}
        <div className="flex-shrink-0 p-4 pt-12 mt-11 pb-3 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-xl font-bold text-foreground">{currentTask.title}</h2>
              {isCurrentTaskCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
          </div>

          {/* Concept badges */}
          <div className="flex flex-wrap items-center gap-2">
            {concepts.map((concept: string) => {
              const conceptInfo = conceptIcons[concept]
              const Icon = conceptInfo?.icon
              return (
                <Badge
                  key={concept}
                  variant="secondary"
                  className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 ${conceptInfo?.className || "bg-primary/10 text-primary hover:bg-primary/20"}`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {concept}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 pb-28">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Description */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Task Description
                </h3>
                <Card className="p-4 bg-muted/30">
                  <p className="text-sm text-foreground leading-relaxed">{currentTask.description}</p>
                </Card>
              </div>

              <Separator />

              {/* Examples */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Examples</h3>
                <div className="space-y-3">
                  {currentTask.examples.map((example: any, index: number) => (
                    <Card key={index} className="overflow-hidden border-0 shadow-sm bg-card">
                      <div className="bg-muted/50 px-4 py-2 border-b">
                        <h4 className="text-sm font-medium text-foreground">Example {index + 1}</h4>
                      </div>
                      <div className="p-4">
                        <pre className="text-xs bg-muted/30 p-3 rounded-lg font-mono border whitespace-pre-wrap break-words overflow-hidden">
                          <code className="text-foreground block">
                            {Object.entries(example.input).map(([key, value]) => {
                              return typeof value === "string"
                                ? `Input: ${key} = "${value}"\n`
                                : `Input: ${key} = ${JSON.stringify(value)}\n`
                            })}
                            <span className="text-green-600 font-medium">Output: {example.output}</span>
                          </code>
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-sm space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Task Progress</span>
              <span>
                {currentMethodIndex + 1} of {sessionData?.tasks.length || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={currentMethodIndex === 0 ? "cursor-not-allowed" : ""}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousClick} 
                      disabled={currentMethodIndex === 0}
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        currentMethodIndex === 0 ? "pointer-events-none" : ""
                      }`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {currentMethodIndex === 0 
                      ? "You're on the first task" 
                      : "Go back to the previous task"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={!isCurrentTaskCompleted ? "cursor-not-allowed" : ""}>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleFinishedClick}
                      disabled={!isCurrentTaskCompleted}
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        !isCurrentTaskCompleted ? "opacity-50 pointer-events-none" : ""
                      } ${currentMethodIndex === (sessionData?.tasks.length || 0) - 1 && isCurrentTaskCompleted ? "bg-green-600 hover:bg-green-700" : ""}`}
                    >
                      {currentMethodIndex === (sessionData?.tasks.length || 0) - 1 && isCurrentTaskCompleted ? (
                        <>
                          Finished
                          <CheckCircle className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Next
                          {!isCurrentTaskCompleted ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {currentMethodIndex === (sessionData?.tasks.length || 0) - 1 && isCurrentTaskCompleted
                      ? "Next complete a survey and spin the wheel for prizes!"
                      : !isCurrentTaskCompleted
                        ? "Complete all test cases to unlock the next task"
                        : currentMethodIndex === (sessionData?.tasks.length || 0) - 1
                          ? "Complete this task to finish"
                          : "Proceed to next task"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </>
  )
}