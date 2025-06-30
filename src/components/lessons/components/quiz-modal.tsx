"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { saveQuizResponses, checkQuizCompletion } from "@/lib/actions/quiz-actions"
import { CheckCircle, Loader2 } from "lucide-react"

interface QuizQuestion {
  id: string 
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  concept: {
    title: string
    questions: QuizQuestion[]
  } | null
  sessionId?: string 
  lessonId?: string 
  quizType?: 'pre' | 'post' 
  onComplete?: (score: number, conceptTitle: string) => void
}

export function QuizModal({ 
  isOpen, 
  onClose, 
  concept, 
  sessionId,
  lessonId,
  quizType = 'pre',
  onComplete 
}: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Quiz completion check states
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)

  // Check if quiz is completed when modal opens
  useEffect(() => {
    const checkAndSkip = async () => {
      if (!isOpen || !lessonId || !concept) {
        setIsCheckingCompletion(false)
        return
      }

      setIsCheckingCompletion(true)
      
      try {
        const result = await checkQuizCompletion(lessonId, quizType)
        
        if (result.completed) {
          // Quiz is completed, show completion screen
          console.log(`${quizType}-quiz already completed`)
          setIsAlreadyCompleted(true)
          
          // Auto-proceed after 2 seconds
          setTimeout(() => {
            if (onComplete) {
              onComplete(100, concept.title) // Use 100 as default score
            }
            onClose()
          }, 2000)
        }
      } catch (error) {
        // If check fails, just proceed with the quiz
        console.warn('Quiz completion check failed, proceeding with quiz', error)
      } finally {
        setIsCheckingCompletion(false)
      }
    }

    checkAndSkip()
  }, [isOpen, lessonId, quizType, concept, onComplete, onClose])

  if (!concept) return null

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
    setSaveError(null)
  }

  const handleNext = async () => {
    if (currentQuestion < concept.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Quiz completed - calculate score and save responses
      setIsSaving(true)
      setSaveError(null)

      try {
        const calculateScore = () => {
          let correct = 0
          concept.questions.forEach((question, index) => {
            if (selectedAnswers[index] === question.correctAnswer) {
              correct++
            }
          })
          return Math.round((correct / concept.questions.length) * 100)
        }

        const score = calculateScore()

        // Save quiz responses if sessionId is provided
        if (sessionId) {
          const responses = concept.questions.map((question, index) => ({
            questionId: question.id,
            selectedAnswer: selectedAnswers[index].toString(),
            isCorrect: selectedAnswers[index] === question.correctAnswer
          }))

          const saveResult = await saveQuizResponses(sessionId, responses, quizType)
          
          if (!saveResult.success) {
            setSaveError(saveResult.error || "Failed to save quiz responses")
            setIsSaving(false)
            return
          }
        }

        // Call completion handler
        if (onComplete) {
          onComplete(score, concept.title)
        }

        // Reset quiz state
        setCurrentQuestion(0)
        setSelectedAnswers([])
        setIsSaving(false)
        onClose()

      } catch (error) {
        console.error('Error completing quiz:', error)
        setSaveError('An unexpected error occurred while saving your responses')
        setIsSaving(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleClose = () => {
    if (isSaving || isCheckingCompletion) return

    // Reset quiz state when closing
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setSaveError(null)
    setIsCheckingCompletion(true)
    setIsAlreadyCompleted(false)
    onClose()
  }

  const currentQ = concept.questions[currentQuestion]
  const isAnswered = selectedAnswers[currentQuestion] !== undefined

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white border-2 border-black">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-black">
              {concept.title} {quizType === 'pre' ? 'Pre-Quiz' : 'Post-Quiz'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Checking Completion Loading */}
          {isCheckingCompletion && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Checking Quiz Status...</h3>
              <p className="text-gray-500">Please wait while we verify your progress.</p>
            </div>
          )}

          {/* Already Completed State */}
          {isAlreadyCompleted && !isCheckingCompletion && (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-green-800 mb-3">Quiz Already Completed!</h3>
              <p className="text-gray-600">
                Proceeding to the next step...
              </p>
              <div className="mt-6">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          )}

          {/* Normal Quiz Interface */}
          {!isCheckingCompletion && !isAlreadyCompleted && (
            <>
              {/* Error Display */}
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{saveError}</p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Question {currentQuestion + 1} of {concept.questions.length}
                  </span>
                  <span>{Math.round(((currentQuestion + 1) / concept.questions.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / concept.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black">{currentQ.question}</h3>

                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isSaving}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswers[currentQuestion] === index
                          ? "border-gray-500 bg-gray-50"  
                          : "border-gray-200 hover:border-gray-500 hover:bg-gray-50"
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswers[currentQuestion] === index ? "border-black bg-black" : "border-gray-300"
                          }`}
                        >
                          {selectedAnswers[currentQuestion] === index && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-gray-800">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0 || isSaving}
                  variant="outline"
                  className="border-2 border-gray-200 hover:border-gray-600 transition-colors disabled:opacity-50"
                >
                  Previous
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!isAnswered || isSaving}
                  className="bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    currentQuestion === concept.questions.length - 1 ? "Finish Quiz" : "Next Question"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}