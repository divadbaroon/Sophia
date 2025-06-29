"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, AlertCircle } from "lucide-react"
import { saveDemographicData } from "@/lib/actions/demographic-actions" 

import { DemographicData, DemographicFormProps } from "@/types"

export function DemographicForm({ isOpen, onSubmit, classId }: DemographicFormProps) {
  const [formData, setFormData] = useState<DemographicData>({
    name: "",
    age: "",
    gender: "",
    ethnicity: "",
    education: "",
    major: "",
    programmingExperience: "",
    yearsOfExperience: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof DemographicData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null) // Clear error when user makes changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await saveDemographicData(classId, formData)
      
      if (!result.success) {
        setError(result.error || 'Failed to save demographic information')
        setIsSubmitting(false)
        return
      }

      // Success! Call onSubmit to trigger the success flow
      onSubmit()
    } catch (error) {
      console.error('Demographic submission error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-black">
        <DialogTitle className="text-2xl font-bold text-black"></DialogTitle>

        <div className="pt-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-black mb-2 -mt-9">Demographic Information</h3>
            <p className="text-sm text-gray-600 mb-4">
              All information is collected for research purposes and will be kept confidential.
            </p>
            {/* Separator line */}
            <div className="border-b border-gray-300"></div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-black border-b border-gray-200 pb-2">Basic Information</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="border-2 border-gray-200 focus:border-gray-400 transition-colors"
                  />
                  <p className="text-xs text-gray-500">
                    Used for providing you with extra credit, per your professors request.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age Range *</Label>
                  <Select value={formData.age} onValueChange={(value) => handleInputChange("age", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-18">Under 18</SelectItem>
                      <SelectItem value="18-24">18-24</SelectItem>
                      <SelectItem value="25-34">25-34</SelectItem>
                      <SelectItem value="35-44">35-44</SelectItem>
                      <SelectItem value="45-54">45-54</SelectItem>
                      <SelectItem value="55-plus">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender Identity *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major *</Label>
                  <Select value={formData.major} onValueChange={(value) => handleInputChange("major", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your major" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computer-science">Computer Science</SelectItem>
                      <SelectItem value="computer-engineering">Computer Engineering</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="information-technology">Information Technology</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="electrical-engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education Level (Current Year) *</Label>
                  <Select value={formData.education} onValueChange={(value) => handleInputChange("education", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate Student</SelectItem>
                      <SelectItem value="masters">Masters Student</SelectItem>
                      <SelectItem value="phd">PhD Student</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Programming Experience */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-black border-b border-gray-200 pb-2">Programming Experience</h4>

              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Programming Experience *</Label>
                <Select
                  value={formData.yearsOfExperience}
                  onValueChange={(value) => handleInputChange("yearsOfExperience", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select years of experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 years (Complete beginner)</SelectItem>
                    <SelectItem value="less-than-1">Less than 1 year</SelectItem>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10-plus">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Information...
                  </>
                ) : (
                  <>
                    Continue to Class
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Your privacy is important to us. All data is collected for research purposes and will be kept
                confidential.
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}