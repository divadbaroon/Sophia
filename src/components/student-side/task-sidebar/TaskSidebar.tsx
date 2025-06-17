"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Target, BookOpen, Zap, ChevronRight, CheckCircle, Lock } from "lucide-react"
import { useFile } from "@/lib/context/FileContext"
import { conceptIcons } from "@/lib/data/student_tasks"
import { QuizModal } from "@/components/lessons/components/quiz-modal"
import { SurveyModal } from "@/components/lessons/components/survery-modal"

export default function TaskSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false)
  const [currentConceptTitle, setCurrentConceptTitle] = useState("")

  const {
    sessionData,
    currentMethodIndex,
    goToNextMethod,
    goToPrevMethod,
    isTaskCompleted,
    isTaskUnlocked,
    canGoToNext,
    getCompletionStats,
    setShowReport,
  } = useFile()

  // Check if all tasks are completed
  const allTasksCompleted = sessionData?.tasks.every((_, index) => isTaskCompleted(index)) || false

  // Mock quiz data - replace with actual quiz data based on current task/concept
  const mockQuizData = {
    title: "Lambda Functions",
    questions: [
      {
        question: "What is a lambda function in Python?",
        options: [
          "A named function defined with def",
          "An anonymous function defined with lambda",
          "A built-in Python function",
          "A class method",
        ],
        correctAnswer: 1,
        explanation:
          "Lambda functions are anonymous functions defined using the lambda keyword, allowing you to create small functions inline.",
      },
      {
        question: "Which of the following is the correct syntax for a lambda function?",
        options: [
          "lambda x: x * 2",
          "def lambda(x): return x * 2",
          "lambda(x) => x * 2",
          "function lambda(x) { return x * 2 }",
        ],
        correctAnswer: 0,
        explanation:
          "The correct syntax is 'lambda arguments: expression', where the expression is automatically returned.",
      },
      {
        question: "What is the main limitation of lambda functions?",
        options: [
          "They can't use variables",
          "They can only contain a single expression",
          "They can't be assigned to variables",
          "They can't take parameters",
        ],
        correctAnswer: 1,
        explanation: "Lambda functions can only contain a single expression, not statements or multiple lines of code.",
      },
    ],
  }

  const handleFinishedClick = () => {
    if (allTasksCompleted) {
      // Get the current concept title from the task or use a default
      const conceptTitle = sessionData?.tasks[currentMethodIndex]?.title || "Lambda Functions"
      setCurrentConceptTitle(conceptTitle)
      setIsQuizModalOpen(true)
    } else {
      goToNextMethod()
    }
  }

  const handleQuizComplete = (score: number, conceptTitle: string) => {
    setIsQuizModalOpen(false)
    setCurrentConceptTitle(conceptTitle)
    setIsSurveyModalOpen(true)
  }

  const handleSurveySubmit = (surveyData: any) => {
    console.log("Survey data submitted:", surveyData)
    setIsSurveyModalOpen(false)
    // Redirect to homepage after survey
    window.location.href = "/"
  }

  // Show loading state if sessionData not ready
  if (!sessionData || !sessionData.tasks) {
    return (
      <div
        className={`h-screen flex items-center justify-center transition-all duration-300 ${isCollapsed ? "w-12" : "w-full"}`}
      >
        {isCollapsed ? (
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="p-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading task information...</p>
          </div>
        )}
      </div>
    )
  }

  const currentTask = sessionData.tasks[currentMethodIndex]
  const concepts = sessionData.conceptMappings[currentMethodIndex] || []

  // Mock difficulty level - you can replace this with actual data from your task
  const difficultyLevel = currentTask.difficulty || "Beginner"
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDifficultyIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
      case "easy":
        return <Zap className="h-3 w-3" />
      case "medium":
        return <Target className="h-3 w-3" />
      case "hard":
        return <BookOpen className="h-3 w-3" />
      default:
        return <Target className="h-3 w-3" />
    }
  }

  if (isCollapsed) {
    return (
      <div className="h-screen w-12 bg-gradient-to-b from-background to-muted/20 border-r flex flex-col items-center py-4 transition-all duration-300 relative">
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="p-2 mb-4">
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-xs text-muted-foreground writing-mode-vertical transform rotate-180">
            {currentMethodIndex + 1}/{sessionData.tasks.length}
          </div>
        </div>

        {/* Fixed navigation at bottom for collapsed state */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevMethod}
            disabled={currentMethodIndex === 0}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMethod}
            disabled={currentMethodIndex === sessionData.tasks.length - 1}
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
        {/* Header with collapse button - Fixed height */}
        <div className="flex-shrink-0 p-4 pt-12 mt-11 pb-3 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-xl font-bold text-foreground">{currentTask.title}</h2>
              {isTaskCompleted(currentMethodIndex) && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
          </div>

          {/* Difficulty and Concept badges inline */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`${getDifficultyColor(difficultyLevel)} flex items-center gap-1`}>
              {getDifficultyIcon(difficultyLevel)}
              {difficultyLevel}
            </Badge>

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

        {/* Scrollable content area - Takes remaining space but leaves room for fixed navigation */}
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
                        <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto font-mono border">
                          <code className="text-foreground">
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
                      Congratulations! You've successfully completed all lambda function tasks. Click "Finished" to take
                      a quick quiz and provide feedback.
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
                {currentMethodIndex + 1} of {sessionData.tasks.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Completed: {getCompletionStats().completed}/{getCompletionStats().total}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevMethod}
              disabled={currentMethodIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleFinishedClick}
              disabled={!allTasksCompleted && !isTaskCompleted(currentMethodIndex)}
              className={`flex items-center gap-2 ${
                !allTasksCompleted && !isTaskCompleted(currentMethodIndex) ? "opacity-50 cursor-not-allowed" : ""
              } ${allTasksCompleted ? "bg-green-600 hover:bg-green-700" : ""}`}
              title={
                allTasksCompleted
                  ? "Take quiz and complete survey"
                  : !isTaskCompleted(currentMethodIndex)
                    ? "Complete all test cases to unlock the next task"
                    : currentMethodIndex === sessionData.tasks.length - 1
                      ? "You've completed all tasks!"
                      : "Proceed to next task"
              }
            >
              {allTasksCompleted ? (
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
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        concept={mockQuizData}
        onComplete={handleQuizComplete}
      />

      <SurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        conceptTitle={currentConceptTitle}
        onSubmit={handleSurveySubmit}
      />
    </>
  )
}
