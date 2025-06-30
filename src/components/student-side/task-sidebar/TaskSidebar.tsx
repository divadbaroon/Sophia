"use client"

import { useState } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, ArrowRight, Target, ChevronRight, CheckCircle, Lock } from "lucide-react"

import { QuizModal } from "@/components/lessons/components/quiz-modal"
import { SurveyModal } from "@/components/lessons/components/survey-modal"
import PrizeWheelModal from "@/components/lessons/components/prize-wheel" 

import { completeLessonProgress } from "@/lib/actions/learning-session-actions"
import { trackNavigation } from "@/lib/actions/sidebar-navigation-actions"

import { useFile } from "@/lib/context/FileContext"

import { conceptIcons } from "@/lib/data/conceptIcons"

import { TaskSidebarProps } from "@/types"

export default function TaskSidebar({ 
  isQuizModalOpen, 
  setIsQuizModalOpen, 
  isSurveyModalOpen, 
  setIsSurveyModalOpen 
}: TaskSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentConceptTitle, setCurrentConceptTitle] = useState("")
  const [showPrizeWheel, setShowPrizeWheel] = useState(false) 

  const {
    sessionData,
    currentMethodIndex,
    goToNextMethod,
    goToPrevMethod,
    isTaskCompleted,
    sessionId,
    lessonId,
    quizData, 
  } = useFile()

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

  // Check if all tasks are completed
  const allTasksCompleted = sessionData?.tasks.every((_, index) => isTaskCompleted(index)) || false

  const handleFinishedClick = () => {
    // Add null check for sessionData
    if (!sessionData || !sessionData.tasks) {
      console.warn('Session data not available')
      return
    }

    if (currentMethodIndex === sessionData.tasks.length - 1 && isTaskCompleted(currentMethodIndex)) {
      // Only show quiz on the last task when it's completed
      const conceptTitle = sessionData.tasks[currentMethodIndex]?.title || "Lesson Complete"
      setCurrentConceptTitle(conceptTitle)
      setIsQuizModalOpen(true)
    } else {
      handleNextClick() 
    }
  }

  const handleQuizComplete = async (score: number, conceptTitle: string) => {
    setIsQuizModalOpen(false)
    setCurrentConceptTitle(conceptTitle)
    
    if (lessonId) {
      try {
        console.log('📝 Updating lesson progress...', { lessonId, score })
        const result = await completeLessonProgress(lessonId, score)
        
        if (result.success) {
          console.log('✅ Lesson completed successfully!', result.data)
        } else {
          console.error('❌ Failed to update lesson progress:', result.error)
        }
      } catch (error) {
        console.error('❌ Error updating lesson progress:', error)
      }
    } else {
      console.warn('⚠️ No lessonId available to update progress')
    }
    
    // Open survey modal
    setIsSurveyModalOpen(true)
  }

  const handleSurveyComplete = () => {
    setIsSurveyModalOpen(false)
    setShowPrizeWheel(true)
  }

  const handlePrizeWon = (prize: string) => {
    console.log("🎉 Prize won:", prize)
    
    // Here you can save the prize to your backend
    // Example API call:
    // await fetch('/api/user-prizes', {
    //   method: 'POST',
    //   body: JSON.stringify({ 
    //     userId: user?.id, 
    //     prize, 
    //     lessonId,
    //     timestamp: new Date().toISOString()
    //   })
    // });
    
    // You could also track this event for analytics
    // analytics.track('prize_won', { prize, lessonId, userId });
  }

  const handlePrizeWheelClose = () => {
    setShowPrizeWheel(false)
    
    // Now redirect to concepts page after the wheel
    window.location.href = "/concepts"
  }

  // Add null checks since global loading guarantees sessionData exists
  const currentTask = sessionData?.tasks[currentMethodIndex]
  const concepts = sessionData?.conceptMappings[currentMethodIndex] || []

  // Early return if data is not available 
  if (!sessionData || !currentTask) {
    return null
  }

  if (isCollapsed) {
    return (
      <div className="h-screen w-12 bg-gradient-to-b from-background to-muted/20 border-r flex flex-col items-center py-4 transition-all duration-300 relative">
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="p-2 mb-4">
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-xs text-muted-foreground writing-mode-vertical transform rotate-180">
            {currentMethodIndex + 1}/{sessionData?.tasks.length || 0}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousClick} 
            disabled={currentMethodIndex === 0}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextClick} 
            disabled={currentMethodIndex === (sessionData?.tasks.length || 0) - 1}
            className="p-2"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/20 transition-all duration-300 relative">
        {/* Header */}
        <div className="flex-shrink-0 p-4 pt-12 mt-11 pb-3 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-xl font-bold text-foreground">{currentTask.title}</h2>
              {isTaskCompleted(currentMethodIndex) && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
          </div>

          {/* Concept badges inline */}
          <div className="flex flex-wrap items-center gap-2">
            {concepts.length === 0 && (
              <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-800">
                Lambda Functions
              </Badge>
            )}

            {concepts.map((concept) => {
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
                  {currentTask.examples.map((example, index) => (
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

              {/* All Tasks Completion Status */}
              {allTasksCompleted && (
                <div className="space-y-3">
                  <Separator />
                  <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-6 w-6" />
                      <p className="text-base font-bold">🎉 All Tasks Completed!</p>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Congratulations! You&apos;ve successfully completed all tasks. Click &quot;Finished&quot; to take
                      a quick quiz, provide feedback, and <span className="font-semibold text-purple-700">spin the wheel for a chance to win a prize!</span> 🎰
                    </p>
                  </Card>
                </div>
              )}

              {/* Individual Task Completion Status */}
              {isTaskCompleted(currentMethodIndex) && !allTasksCompleted && (
                <div className="space-y-3">
                  <Separator />
                  <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <p className="text-sm font-medium">Task Completed!</p>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      All test cases passed. You can now proceed to the next task.
                    </p>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Fixed navigation at bottom of screen */}
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
                      className={`flex items-center gap-2 ${
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
                  <span className={!isTaskCompleted(currentMethodIndex) ? "cursor-not-allowed" : ""}>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleFinishedClick}
                      disabled={!isTaskCompleted(currentMethodIndex)}
                      className={`flex items-center gap-2 ${
                        !isTaskCompleted(currentMethodIndex) ? "opacity-50 pointer-events-none" : ""
                      } ${currentMethodIndex === (sessionData?.tasks.length || 0) - 1 && isTaskCompleted(currentMethodIndex) ? "bg-green-600 hover:bg-green-700" : ""}`}
                    >
                      {currentMethodIndex === (sessionData?.tasks.length || 0) - 1 && isTaskCompleted(currentMethodIndex) ? (
                        <>
                          Finished
                          <CheckCircle className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Next
                          {!isTaskCompleted(currentMethodIndex) ? (
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
                    {currentMethodIndex === (sessionData?.tasks.length || 0) - 1 && isTaskCompleted(currentMethodIndex)
                      ? "Take quiz, complete survey, and spin the wheel for prizes!"
                      : !isTaskCompleted(currentMethodIndex)
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

      {/* Modals */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        concept={quizData} 
        sessionId={sessionId}
        lessonId={lessonId} 
        quizType="post"
        onComplete={handleQuizComplete}
      />

      <SurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        conceptTitle={currentConceptTitle}
        sessionId={sessionId}        
        lessonId={lessonId}          
        onComplete={handleSurveyComplete}
      />

      {/* Prize Wheel Modal */}
      <PrizeWheelModal
        isOpen={showPrizeWheel}
        onClose={handlePrizeWheelClose}
        onPrizeWon={handlePrizeWon}
        sessionId={sessionId}     
        lessonId={lessonId}     
      />
    </>
  )
}