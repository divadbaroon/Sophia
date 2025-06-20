"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight } from "lucide-react"

interface DemographicData {
  // Basic Information
  age: string
  gender: string
  ethnicity: string
  education: string

  // Programming Experience
  programmingExperience: string
  yearsOfExperience: string
}

interface DemographicFormProps {
  isOpen: boolean
  onSubmit: (data: DemographicData) => void
  classId: string | null
}

export function DemographicForm({ isOpen, onSubmit }: DemographicFormProps) {
  const [formData, setFormData] = useState<DemographicData>({
    age: "",
    gender: "",
    ethnicity: "",
    education: "",
    programmingExperience: "",
    yearsOfExperience: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof DemographicData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    onSubmit(formData)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-black">
          <DialogTitle className="text-2xl font-bold text-black"></DialogTitle>
     

        <div className="pt-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-black mb-2 -mt-9">Demographic Information</h3>
            <p className="text-sm text-gray-600">
              All information is collected for research purposes and will be kept confidential.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-black border-b border-gray-200 pb-2">Basic Information</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age Range</Label>
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
                  <Label htmlFor="gender">Gender Identity</Label>
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
                    <Label htmlFor="major">Major</Label>
                    <Select value={formData.education} onValueChange={(value) => handleInputChange("education", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
                        <SelectItem value="masters">Master&apos;s Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education Level (Current Year)</Label>
                  <Select value={formData.education} onValueChange={(value) => handleInputChange("education", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
                      <SelectItem value="masters">Master&apos;s Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
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
                <Label htmlFor="yearsOfExperience">Years of Programming Experience</Label>
                <Select
                  value={formData.yearsOfExperience}
                  onValueChange={(value) => handleInputChange("yearsOfExperience", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select years of experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 years</SelectItem>
                    <SelectItem value="1">Less than 1 year</SelectItem>
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
                className="w-full bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining Class...
                  </>
                ) : (
                  <>
                    Join Class
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
