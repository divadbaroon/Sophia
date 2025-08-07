"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, ArrowRight, Gift, Loader2 } from "lucide-react"
import { saveSurveyResponse, checkSurveyCompletion } from "@/lib/actions/survey-actions"

interface SurveyData {
  // Cognitive Load
  mentalEffort: string
  difficulty: string
  concentration: string

  // System Effectiveness
  misconceptionFocus: string
  remediation: string
  learningHelp: string
  visualHelpTiming: string
  visualHelpClarity: string

  // Overall Experience
  satisfaction: string
  recommendation: string

  // Open-ended feedback
  improvements: string
  additionalComments: string
  interviewEmail: string
}

interface SurveyModalProps {
  isOpen: boolean
  onClose: () => void
  conceptTitle: string
  sessionId?: string
  lessonId?: string
  onComplete: () => void
}

export function SurveyModal({ 
  isOpen, 
  onClose, 
  sessionId,
  lessonId,
  onComplete 
}: SurveyModalProps) {
  const [formData, setFormData] = useState<SurveyData>({
    mentalEffort: "",
    difficulty: "",
    concentration: "",
    misconceptionFocus: "",
    remediation: "",
    learningHelp: "",
    visualHelpTiming: "",
    visualHelpClarity: "",
    satisfaction: "",
    recommendation: "",
    improvements: "",
    additionalComments: "",
    interviewEmail: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true)

  // Check if survey is already completed when modal opens
  useEffect(() => {
    const checkAndSkip = async () => {
      if (!isOpen || !lessonId) {
        setIsCheckingCompletion(false)
        return
      }

      setIsCheckingCompletion(true)
      
      try {
        console.log('🔍 Checking survey completion...')
        const result = await checkSurveyCompletion(lessonId)
        
        if (result.completed) {
          console.log('✅ Survey already completed, skipping to prize wheel')
          // Survey already completed, skip 
          onComplete()
          onClose()
        }
      } catch (error) {
        console.error('❌ Error checking survey completion:', error)
        // If check fails, just proceed with survey
      } finally {
        setIsCheckingCompletion(false)
      }
    }

    checkAndSkip()
  }, [isOpen, lessonId, onComplete, onClose])

  const handleInputChange = (field: keyof SurveyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaveError(null) // Clear error when user types
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaveError(null)

    try {
      // Save to database if sessionId and lessonId are provided
      if (sessionId && lessonId) {
        const result = await saveSurveyResponse(sessionId, lessonId, formData)
        
        if (!result.success) {
          setSaveError(result.error || "Failed to save survey")
          setIsSubmitting(false)
          return
        }

        console.log('✅ Survey saved successfully!', result.data)
        if (result.data?.hasInterviewEmail) {
          console.log('📧 User provided email for interview')
        }
      }

      // Reset form
      setFormData({
        mentalEffort: "",
        difficulty: "",
        concentration: "",
        misconceptionFocus: "",
        remediation: "",
        learningHelp: "",
        visualHelpTiming: "",
        visualHelpClarity: "",
        satisfaction: "",
        recommendation: "",
        improvements: "",
        additionalComments: "",
        interviewEmail: "",
      })

      setIsSubmitting(false)
      
      // Call parent completion handler
      onComplete()
      onClose()

    } catch (error) {
      console.error('Error submitting survey:', error)
      setSaveError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting || isCheckingCompletion) return // Prevent closing while saving or checking

    // Reset form and errors when closing
    setFormData({
      mentalEffort: "",
      difficulty: "",
      concentration: "",
      misconceptionFocus: "",
      remediation: "",
      learningHelp: "",
      visualHelpTiming: "",
      visualHelpClarity: "",
      satisfaction: "",
      recommendation: "",
      improvements: "",
      additionalComments: "",
      interviewEmail: "",
    })
    setSaveError(null)
    onClose()
  }

  const isFormValid =
    formData.mentalEffort &&
    formData.difficulty &&
    formData.misconceptionFocus &&
    formData.remediation &&
    formData.learningHelp 

  const likertScale = [
    { value: "5", label: "Strongly Agree" },
    { value: "4", label: "Agree" },
    { value: "3", label: "Neutral" },
    { value: "2", label: "Disagree" },
    { value: "1", label: "Strongly Disagree" },
  ]

  const effortScale = [
    { value: "5", label: "Very High" },
    { value: "4", label: "High" },
    { value: "3", label: "Moderate" },
    { value: "2", label: "Low" },
    { value: "1", label: "Very Low" },
  ]
  
  // Show loading state while checking if survey is already completed
  if (isCheckingCompletion && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-white border-2 border-black">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading Survey</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Preparing Your Survey</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Almost done! We&apos;re preparing a quick survey for you.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-2 border-black">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-black" />
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-black">Learning Experience Survey</DialogTitle>
              <p className="text-gray-600 mt-1">Help us improve your learning experience with Sophia</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          {/* Error Display */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{saveError}</p>
            </div>
          )}

          {/* Prize Incentive Banner */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-purple-800">🎉 You&apos;re Almost There!</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Complete this quick survey to unlock a spin of the <span className="font-semibold">prize wheel</span>! 
                    Your feedback helps us make learning better for everyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Effectiveness Section */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                System Effectiveness
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    The system effectively focused on my misconceptions. *
                  </Label>
                  <RadioGroup
                    value={formData.misconceptionFocus}
                    onValueChange={(value) => handleInputChange("misconceptionFocus", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`misconception-${option.value}`} />
                        <Label htmlFor={`misconception-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    The system effectively helped remediate my understanding. *
                  </Label>
                  <RadioGroup
                    value={formData.remediation}
                    onValueChange={(value) => handleInputChange("remediation", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`remediation-${option.value}`} />
                        <Label htmlFor={`remediation-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    The system helped me learn this concept effectively. *
                  </Label>
                  <RadioGroup
                    value={formData.learningHelp}
                    onValueChange={(value) => handleInputChange("learningHelp", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`learning-${option.value}`} />
                        <Label htmlFor={`learning-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cognitive Load Section */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                Cognitive Load & Mental Effort
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    I invested a lot of mental effort in learning this concept. *
                  </Label>
                  <RadioGroup
                    value={formData.mentalEffort}
                    onValueChange={(value) => handleInputChange("mentalEffort", value)}
                  >
                    {effortScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`effort-${option.value}`} />
                        <Label htmlFor={`effort-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    This concept was difficult to understand. *
                  </Label>
                  <RadioGroup
                    value={formData.difficulty}
                    onValueChange={(value) => handleInputChange("difficulty", value)}
                  >
                    {effortScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`difficulty-${option.value}`} />
                        <Label htmlFor={`difficulty-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    I was able to concentrate well during the lesson.
                  </Label>
                  <RadioGroup
                    value={formData.concentration}
                    onValueChange={(value) => handleInputChange("concentration", value)}
                  >
                    {effortScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`concentration-${option.value}`} />
                        <Label htmlFor={`concentration-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Experience Section */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                Overall Experience
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    I am satisfied with my learning experience.
                  </Label>
                  <RadioGroup
                    value={formData.satisfaction}
                    onValueChange={(value) => handleInputChange("satisfaction", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`satisfaction-${option.value}`} />
                        <Label htmlFor={`satisfaction-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    I would recommend this learning system to other students.
                  </Label>
                  <RadioGroup
                    value={formData.recommendation}
                    onValueChange={(value) => handleInputChange("recommendation", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`recommendation-${option.value}`} />
                        <Label htmlFor={`recommendation-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Feedback Section */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                Additional Feedback
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="additionalComments" className="text-sm font-medium text-gray-700">
                    Any additional comments about your learning experience?
                  </Label>
                  <Textarea
                    id="additionalComments"
                    placeholder="Share any other thoughts or feedback..."
                    value={formData.additionalComments}
                    onChange={(e) => handleInputChange("additionalComments", e.target.value)}
                    className="border-2 border-gray-200 focus:border-black transition-colors resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Opportunity Section */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                Interview Opportunity - $10 compensation 
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 mb-2">
                    We&apos;d love to hear more about your learning experience. Please share your email below if you&apos;re interested in participating in a brief 30-minute interview for $10 compensation.
                  </p>
                  <Textarea
                    id="interview"
                    placeholder="Please enter your email if you're interested"
                    value={formData.interviewEmail}
                    onChange={(e) => handleInputChange("interviewEmail", e.target.value)}
                    className="border-2 border-gray-200 focus:border-black transition-colors resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Survey...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Complete Survey & Spin the Wheel!
                  <ArrowRight size={16} />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Thank you for your feedback!
              <br />
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}