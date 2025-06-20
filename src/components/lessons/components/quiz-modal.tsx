"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { saveQuizResponses } from "@/lib/actions/quiz-actions"

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
  quizType?: 'pre' | 'post' 
  onComplete?: (score: number, conceptTitle: string) => void
}

export function QuizModal({ 
  isOpen, 
  onClose, 
  concept, 
  sessionId,
  quizType = 'pre',
  onComplete 
}: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!concept) return null

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
    setSaveError(null) // Clear any previous errors
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
    if (isSaving) return // Prevent closing while saving

    // Reset quiz state when closing
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setSaveError(null)
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
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
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
              className="border-2 border-gray-200 hover:border-black transition-colors disabled:opacity-50"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}