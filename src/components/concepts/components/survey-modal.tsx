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

import { SurveyData, SurveyModalProps } from "@/types"

export function SurveyModal({ 
  isOpen, 
  onClose, 
  sessionId,
  lessonId,
  onComplete 
}: SurveyModalProps) {
  const [formData, setFormData] = useState<SurveyData>({
    sophiaHelpfulness: "",
    sophiaReliability: "",
    sophiaTeachingStyle: "",
    instructorAlignment: "",
    aiVsHumanPreference: "",
    conceptUnderstanding: "",
    problemSolvingImprovement: "",
    examPreparation: "",
    learningAutonomy: "",
    easeOfUse: "",
    voiceInteractionQuality: "",
    appropriateHelp: "",
    trustInGuidance: "",
    confidenceInLearning: "",
    comfortWithAI: "",
    bestAspects: "",
    improvements: "",
    comparisonToInstructor: "",
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
          onComplete()
          onClose()
        }
      } catch (error) {
        console.error('❌ Error checking survey completion:', error)
      } finally {
        setIsCheckingCompletion(false)
      }
    }

    checkAndSkip()
  }, [isOpen, lessonId, onComplete, onClose])

  const handleInputChange = (field: keyof SurveyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaveError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaveError(null)

    try {
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
        sophiaHelpfulness: "",
        sophiaReliability: "",
        sophiaTeachingStyle: "",
        instructorAlignment: "",
        aiVsHumanPreference: "",
        conceptUnderstanding: "",
        problemSolvingImprovement: "",
        examPreparation: "",
        learningAutonomy: "",
        easeOfUse: "",
        voiceInteractionQuality: "",
        appropriateHelp: "",
        trustInGuidance: "",
        confidenceInLearning: "",
        comfortWithAI: "",
        bestAspects: "",
        improvements: "",
        comparisonToInstructor: "",
        additionalComments: "",
        interviewEmail: "",
      })

      setIsSubmitting(false)
      onComplete()
      onClose()

    } catch (error) {
      console.error('Error submitting survey:', error)
      setSaveError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting || isCheckingCompletion) return

    // Reset form and errors when closing
    setFormData({
      sophiaHelpfulness: "",
      sophiaReliability: "",
      sophiaTeachingStyle: "",
      instructorAlignment: "",
      aiVsHumanPreference: "",
      conceptUnderstanding: "",
      problemSolvingImprovement: "",
      examPreparation: "",
      learningAutonomy: "",
      easeOfUse: "",
      voiceInteractionQuality: "",
      appropriateHelp: "",
      trustInGuidance: "",
      confidenceInLearning: "",
      comfortWithAI: "",
      bestAspects: "",
      improvements: "",
      comparisonToInstructor: "",
      additionalComments: "",
      interviewEmail: "",
    })
    setSaveError(null)
    onClose()
  }

  const isFormValid =
    formData.sophiaHelpfulness &&
    formData.sophiaTeachingStyle &&
    formData.instructorAlignment &&
    formData.conceptUnderstanding &&
    formData.examPreparation &&
    formData.learningAutonomy

  const likertScale = [
    { value: "5", label: "Strongly Agree" },
    { value: "4", label: "Agree" },
    { value: "3", label: "Neutral" },
    { value: "2", label: "Disagree" },
    { value: "1", label: "Strongly Disagree" },
  ]

  const qualityScale = [
    { value: "5", label: "Excellent" },
    { value: "4", label: "Good" },
    { value: "3", label: "Average" },
    { value: "2", label: "Poor" },
    { value: "1", label: "Very Poor" },
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
              <p className="text-gray-600 mt-1">Help us improve your experience with Sophia</p>
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
                  <p className="text-sm text-purple-700 mt-1">
                    Complete this quick survey to unlock a spin of the <span className="font-semibold">prize wheel</span>! 
                    Your feedback helps us make learning better for everyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Teaching Assistant Experience */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                AI Teaching Assistant Experience
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Sophia was helpful in learning this concept. *
                  </Label>
                  <RadioGroup
                    value={formData.sophiaHelpfulness}
                    onValueChange={(value) => handleInputChange("sophiaHelpfulness", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`helpful-${option.value}`} />
                        <Label htmlFor={`helpful-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Sophia's teaching approach felt consistent with my instructor's style. *
                  </Label>
                  <RadioGroup
                    value={formData.sophiaTeachingStyle}
                    onValueChange={(value) => handleInputChange("sophiaTeachingStyle", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`style-${option.value}`} />
                        <Label htmlFor={`style-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    I trusted Sophia's guidance because I knew my instructor configured it. *
                  </Label>
                  <RadioGroup
                    value={formData.instructorAlignment}
                    onValueChange={(value) => handleInputChange("instructorAlignment", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`trust-${option.value}`} />
                        <Label htmlFor={`trust-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Sophia provided the right amount of help - guiding me without giving away answers.
                  </Label>
                  <RadioGroup
                    value={formData.appropriateHelp}
                    onValueChange={(value) => handleInputChange("appropriateHelp", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`appropriate-${option.value}`} />
                        <Label htmlFor={`appropriate-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Effectiveness */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                Learning Impact
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    I understand this concept better after using Sophia. *
                  </Label>
                  <RadioGroup
                    value={formData.conceptUnderstanding}
                    onValueChange={(value) => handleInputChange("conceptUnderstanding", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`understanding-${option.value}`} />
                        <Label htmlFor={`understanding-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    I felt I maintained control over my learning while using Sophia. *
                  </Label>
                  <RadioGroup
                    value={formData.learningAutonomy}
                    onValueChange={(value) => handleInputChange("learningAutonomy", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`autonomy-${option.value}`} />
                        <Label htmlFor={`autonomy-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Sophia helped improve my problem-solving skills.
                  </Label>
                  <RadioGroup
                    value={formData.problemSolvingImprovement}
                    onValueChange={(value) => handleInputChange("problemSolvingImprovement", value)}
                  >
                    {likertScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`problem-${option.value}`} />
                        <Label htmlFor={`problem-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Experience */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                System Experience
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    How would you rate the voice interaction with Sophia?
                  </Label>
                  <RadioGroup
                    value={formData.voiceInteractionQuality}
                    onValueChange={(value) => handleInputChange("voiceInteractionQuality", value)}
                  >
                    {qualityScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`voice-${option.value}`} />
                        <Label htmlFor={`voice-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    How easy was the system to use?
                  </Label>
                  <RadioGroup
                    value={formData.easeOfUse}
                    onValueChange={(value) => handleInputChange("easeOfUse", value)}
                  >
                    {qualityScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`ease-${option.value}`} />
                        <Label htmlFor={`ease-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    How comfortable were you interacting with the AI?
                  </Label>
                  <RadioGroup
                    value={formData.comfortWithAI}
                    onValueChange={(value) => handleInputChange("comfortWithAI", value)}
                  >
                    {qualityScale.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`comfort-${option.value}`} />
                        <Label htmlFor={`comfort-${option.value}`} className="text-sm">
                          {option.value} - {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

         <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
              Your Feedback <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bestAspects" className="text-sm font-medium text-gray-700">
                  What worked best about Sophia's help?
                </Label>
                <Textarea
                  id="bestAspects"
                  placeholder="Tell us what you liked most about Sophia's assistance..."
                  value={formData.bestAspects}
                  onChange={(e) => handleInputChange("bestAspects", e.target.value)}
                  className="border-2 border-gray-200 focus:border-black transition-colors resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvements" className="text-sm font-medium text-gray-700">
                  What could be improved about Sophia's assistance?
                </Label>
                <Textarea
                  id="improvements"
                  placeholder="How could Sophia be more helpful?"
                  value={formData.improvements}
                  onChange={(e) => handleInputChange("improvements", e.target.value)}
                  className="border-2 border-gray-200 focus:border-black transition-colors resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comparisonToInstructor" className="text-sm font-medium text-gray-700">
                  How did Sophia's teaching approach compare to your instructor's?
                </Label>
                <Textarea
                  id="comparisonToInstructor"
                  placeholder="Similarities, differences, or other thoughts about the teaching approaches..."
                  value={formData.comparisonToInstructor}
                  onChange={(e) => handleInputChange("comparisonToInstructor", e.target.value)}
                  className="border-2 border-gray-200 focus:border-black transition-colors resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalComments" className="text-sm font-medium text-gray-700">
                  Any additional comments?
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

          {/* Interview Opportunity */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4 border-b border-gray-200 pb-2">
                Interview Opportunity - $10 Compensation 
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 mb-2">
                    We&apos;d love to hear more about your experience with Sophia. Please share your email if you&apos;re interested in a brief 30-minute interview for $10 compensation.
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
              Thank you for helping us improve Sophia!
              <br />
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}