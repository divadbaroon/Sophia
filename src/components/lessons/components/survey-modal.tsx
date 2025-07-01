"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, ArrowRight, Gift, Loader2 } from "lucide-react"
import {
  saveSurveyResponse,
  checkSurveyCompletion,
} from "@/lib/actions/survey-actions"

interface SurveyData {
  /* Cognitive load */
  mentalEffort: string
  difficulty: string
  concentration: string

  /* System effectiveness */
  misconceptionFocus: string
  remediation: string
  learningHelp: string
  visualHelpTiming: string
  visualHelpClarity: string

  /* Overall experience */
  satisfaction: string
  recommendation: string

  /* Open-ended + interview */
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

const EMPTY_FORM: SurveyData = {
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
}

export function SurveyModal({
  isOpen,
  onClose,
  sessionId,
  lessonId,
  onComplete,
}: SurveyModalProps) {
  const [formData, setFormData] = useState<SurveyData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true)

  useEffect(() => {
    const check = async () => {
      if (!isOpen || !lessonId) {
        setIsCheckingCompletion(false)
        return
      }
      try {
        const res = await checkSurveyCompletion(lessonId)
        if (res.completed) {
          onComplete()
          onClose()
          return
        }
      } catch (e) {
        console.error("[Survey] completion check failed", e)
      } finally {
        setIsCheckingCompletion(false)
      }
    }
    check()
  }, [isOpen, lessonId, onComplete, onClose])

  const handleInput = (field: keyof SurveyData, v: string) => {
    setFormData((prev) => ({ ...prev, [field]: v }))
    setSaveError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId || !lessonId) return
    setIsSubmitting(true)
    setSaveError(null)
    try {
      const res = await saveSurveyResponse(sessionId, lessonId, formData)
      if (!res.success) {
        setSaveError(res.error || "Failed to save survey")
        setIsSubmitting(false)
        return
      }
      setFormData(EMPTY_FORM)
      setIsSubmitting(false)
      onComplete()
      onClose()
    } catch (err) {
      console.error("[Survey] submit error", err)
      setSaveError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting || isCheckingCompletion) return
    setFormData(EMPTY_FORM)
    setSaveError(null)
    onClose()
  }

  const isFormValid =
    formData.mentalEffort &&
    formData.difficulty &&
    formData.misconceptionFocus &&
    formData.remediation &&
    formData.learningHelp &&
    formData.visualHelpTiming &&
    formData.visualHelpClarity

  const likert = [
    { value: "1", label: "Strongly Disagree" },
    { value: "2", label: "Disagree" },
    { value: "3", label: "Neutral" },
    { value: "4", label: "Agree" },
    { value: "5", label: "Strongly Agree" },
  ] as const

  const effort = [
    { value: "1", label: "Very Low" },
    { value: "2", label: "Low" },
    { value: "3", label: "Moderate" },
    { value: "4", label: "High" },
    { value: "5", label: "Very High" },
  ] as const

  if (isCheckingCompletion && isOpen)
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-white border-2 border-black">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading Survey</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Preparing your survey…
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Almost done!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-2 border-black">
        {/* --- header --- */}
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-black" />
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-black">
                Learning Experience Survey
              </DialogTitle>
              <p className="text-gray-600 mt-1">
                Help us improve your learning experience with Sophia
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* --- form --- */}
        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          {/* error */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{saveError}</p>
            </div>
          )}

          {/* banner */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Gift className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-purple-800">
                  🎉 You’re Almost There!
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  Complete this quick survey to unlock a spin of the{" "}
                  <span className="font-semibold">prize wheel</span>!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ---- Cognitive Load ---- */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Cognitive Load & Mental Effort
              </h3>

              {/* mental effort */}
              <ScaleQuestion
                label="How much mental effort did you invest in learning this concept? *"
                field="mentalEffort"
                value={formData.mentalEffort}
                scale={effort}
                onChange={handleInput}
              />

              {/* difficulty */}
              <ScaleQuestion
                label="How difficult was it to understand this concept? *"
                field="difficulty"
                value={formData.difficulty}
                scale={effort}
                onChange={handleInput}
              />

              {/* concentration */}
              <ScaleQuestion
                label="How well were you able to concentrate during the lesson?"
                field="concentration"
                value={formData.concentration}
                scale={effort}
                onChange={handleInput}
              />
            </CardContent>
          </Card>

          {/* ---- System Effectiveness ---- */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                System Effectiveness
              </h3>

              <ScaleQuestion
                label="The system focused on my misconceptions. *"
                field="misconceptionFocus"
                value={formData.misconceptionFocus}
                scale={likert}
                onChange={handleInput}
              />

              <ScaleQuestion
                label="The system helped remediate my understanding effectively. *"
                field="remediation"
                value={formData.remediation}
                scale={likert}
                onChange={handleInput}
              />

              <ScaleQuestion
                label="Overall, the system helped me learn this concept. *"
                field="learningHelp"
                value={formData.learningHelp}
                scale={likert}
                onChange={handleInput}
              />

              <ScaleQuestion
                label="The sketch/visualization appeared at a helpful moment. *"
                field="visualHelpTiming"
                value={formData.visualHelpTiming}
                scale={likert}
                onChange={handleInput}
              />

              <ScaleQuestion
                label="The sketch/visualization made the concept clearer. *"
                field="visualHelpClarity"
                value={formData.visualHelpClarity}
                scale={likert}
                onChange={handleInput}
              />
            </CardContent>
          </Card>

          {/* ---- Overall Experience ---- */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Overall Experience
              </h3>

              <ScaleQuestion
                label="How satisfied are you with your learning experience?"
                field="satisfaction"
                value={formData.satisfaction}
                scale={likert}
                onChange={handleInput}
              />

              <ScaleQuestion
                label="Would you recommend this learning system to other students?"
                field="recommendation"
                value={formData.recommendation}
                scale={likert}
                onChange={handleInput}
              />
            </CardContent>
          </Card>

          {/* ---- Additional feedback ---- */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Additional Feedback
              </h3>
              <TextareaField
                id="additionalComments"
                label="Any additional comments about your learning experience?"
                rows={3}
                value={formData.additionalComments}
                onChange={(v) => handleInput("additionalComments", v)}
              />
            </CardContent>
          </Card>

          {/* ---- interview ---- */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Interview Opportunity – $10 compensation
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                We’d love to hear more! Drop your email if you’re interested in
                a 30-minute interview.
              </p>
              <TextareaField
                id="interviewEmail"
                label="Email (optional)"
                rows={2}
                value={formData.interviewEmail}
                onChange={(v) => handleInput("interviewEmail", v)}
              />
            </CardContent>
          </Card>

          {/* ---- submit ---- */}
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 py-6 text-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
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
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ScaleProps {
  label: string
  field: keyof SurveyData
  value: string
  scale: readonly { value: string; label: string }[]
  onChange: (field: keyof SurveyData, v: string) => void
}
const ScaleQuestion: React.FC<ScaleProps> = ({
  label,
  field,
  value,
  scale,
  onChange,
}) => (
  <div className="space-y-3">
    <Label className="text-sm font-medium text-gray-700">{label}</Label>
    <RadioGroup value={value} onValueChange={(v) => onChange(field, v)}>
      {scale.map((opt) => (
        <div key={opt.value} className="flex items-center space-x-2">
          <RadioGroupItem value={opt.value} id={`${field}-${opt.value}`} />
          <Label htmlFor={`${field}-${opt.value}`} className="text-sm">
            {opt.value} – {opt.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  </div>
)

interface TextFieldProps {
  id: string
  label: string
  rows: number
  value: string
  onChange: (v: string) => void
}
const TextareaField: React.FC<TextFieldProps> = ({
  id,
  label,
  rows,
  value,
  onChange,
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <Textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-2 border-gray-200 focus:border-black resize-none"
    />
  </div>
)
