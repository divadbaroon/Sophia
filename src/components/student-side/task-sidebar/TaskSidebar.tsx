"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Target, BookOpen, Zap, ChevronRight, CheckCircle, Lock } from "lucide-react"
import { useFile } from "@/lib/context/FileContext"
import { conceptIcons } from "@/lib/data/conceptIcons"
import { QuizModal } from "@/components/lessons/components/quiz-modal"
import { SurveyModal } from "@/components/lessons/components/survery-modal"
import { completeLessonProgress } from "@/lib/actions/learning-session-actions"
import { getQuizQuestions } from "@/lib/actions/quiz-actions" 

interface TaskSidebarProps {
  isQuizModalOpen: boolean;
  setIsQuizModalOpen: (open: boolean) => void;
  isSurveyModalOpen: boolean;
  setIsSurveyModalOpen: (open: boolean) => void;
}

export default function TaskSidebar({ 
  isQuizModalOpen, 
  setIsQuizModalOpen, 
  isSurveyModalOpen, 
  setIsSurveyModalOpen 
}: TaskSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentConceptTitle, setCurrentConceptTitle] = useState("")
  const [quizData, setQuizData] = useState<any>(null) 
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false) 

  const {
    sessionData,
    currentMethodIndex,
    goToNextMethod,
    goToPrevMethod,
    isTaskCompleted,
    lessonId,
  } = useFile()

  // Check if all tasks are completed
  const allTasksCompleted = sessionData?.tasks.every((_, index) => isTaskCompleted(index)) || false

  useEffect(() => {
    const loadQuizQuestions = async () => {
      if (!lessonId) return
      
      setIsLoadingQuiz(true)
      try {
        const { data: quizQuestions } = await getQuizQuestions(lessonId)
        
        if (quizQuestions && quizQuestions.length > 0) {
          // Format quiz data to match QuizModal expectations
          const formattedQuiz = {
            title: sessionData?.tasks[0]?.title || "Lesson Quiz", 
            questions: quizQuestions.map((question, index) => ({
              ...question,
              id: question.id || `question-${lessonId}-${index}` 
            }))
          }
          setQuizData(formattedQuiz)
        } else {
          // Fallback to mock data if no quiz questions found
          console.warn('No quiz questions found for lesson:', lessonId)
          setQuizData({
            title: "Lesson Quiz",
            questions: [
              {
                id: "mock-1",
                question: "How would you rate your understanding of this lesson?",
                options: [
                  "I need more practice",
                  "I understand the basics",
                  "I feel confident",
                  "I could teach this to someone else"
                ],
                correctAnswer: 2,
                explanation: "Great job completing this lesson! Continue practicing to build confidence."
              }
            ]
          })
        }
      } catch (error) {
        console.error('Error loading quiz questions:', error)
        // Fallback to mock data on error
        setQuizData({
          title: "Lesson Quiz",
          questions: [
            {
              id: "fallback-1",
              question: "You've completed all the tasks! How do you feel?",
              options: [
                "Ready for more challenges",
                "Need to review the concepts",
                "Confident in my understanding",
                "Excited to continue learning"
              ],
              correctAnswer: 0,
              explanation: "Excellent work! Keep up the great progress."
            }
          ]
        })
      } finally {
        setIsLoadingQuiz(false)
      }
    }

    loadQuizQuestions()
  }, [lessonId, sessionData])

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
      goToNextMethod()
    }
  }
  // UPDATE THIS FUNCTION - Add lesson completion logic
  const handleQuizComplete = async (score: number, conceptTitle: string) => {
    setIsQuizModalOpen(false)
    setCurrentConceptTitle(conceptTitle)
    
    // 🎯 UPDATE LESSON PROGRESS IN DATABASE
    if (lessonId) {
      try {
        console.log('📝 Updating lesson progress...', { lessonId, score })
        const result = await completeLessonProgress(lessonId, score)
        
        if (result.success) {
          console.log('✅ Lesson completed successfully!', result.data)
          // Optionally show a success toast/notification here
        } else {
          console.error('❌ Failed to update lesson progress:', result.error)
          // Optionally show an error message to user
        }
      } catch (error) {
        console.error('❌ Error updating lesson progress:', error)
      }
    } else {
      console.warn('⚠️ No lessonId available to update progress')
    }
    
    // Continue with survey modal (optional for user)
    setIsSurveyModalOpen(true)
  }

  const handleSurveySubmit = (surveyData: any) => {
    console.log("Survey data submitted:", surveyData)
    setIsSurveyModalOpen(false)
    // Redirect to homepage after survey
    window.location.href = "/lessons"
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
            <Badge
              variant="outline"
              className={`${getDifficultyColor(difficultyLevel)} text-xs font-medium flex items-center gap-1.5 px-3 py-1.5`}
            >
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
              disabled={!isTaskCompleted(currentMethodIndex) || isLoadingQuiz}
              className={`flex items-center gap-2 ${
                !isTaskCompleted(currentMethodIndex) ? "opacity-50 cursor-not-allowed" : ""
              } ${currentMethodIndex === sessionData.tasks.length - 1 && isTaskCompleted(currentMethodIndex) ? "bg-green-600 hover:bg-green-700" : ""}`}
              title={
                currentMethodIndex === sessionData.tasks.length - 1 && isTaskCompleted(currentMethodIndex)
                  ? "Take quiz and complete survey"
                  : !isTaskCompleted(currentMethodIndex)
                    ? "Complete all test cases to unlock the next task"
                    : currentMethodIndex === sessionData.tasks.length - 1
                      ? "Complete this task to finish"
                      : "Proceed to next task"
              }
            >
              {isLoadingQuiz ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : currentMethodIndex === sessionData.tasks.length - 1 && isTaskCompleted(currentMethodIndex) ? (
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
        concept={quizData} 
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