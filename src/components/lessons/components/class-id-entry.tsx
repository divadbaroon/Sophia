"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, ArrowRight, AlertCircle, CheckCircle } from "lucide-react"
import { enrollInClass } from "@/lib/actions/class-actions"
import { DemographicForm } from "./demographic-form"

export function ClassIdEntry() {
  const [classId, setClassId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDemographicForm, setShowDemographicForm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId.trim()) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const trimmedClassId = classId.trim()
      
      // Basic validation
      if (trimmedClassId.length < 3) {
        setError("Class ID must be at least 3 characters long")
        setIsLoading(false)
        return
      }

      // Try to enroll in class
      const result = await enrollInClass(trimmedClassId)
      
      if (!result.success) {
        setError(result.error || "Failed to join class")
        setIsLoading(false)
        return
      }

      // Class is valid! Show demographic form
      setIsLoading(false)
      setShowDemographicForm(true)

    } catch (error) {
      console.error('Class validation error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDemographicSubmit = async (data: any) => {

    // Show success state
    setShowDemographicForm(false)
    setSuccess("Successfully joined class!")
    setShowSuccess(true)
    
    // Show success for 1 second, then refresh
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Show demographic form
  if (showDemographicForm) {
    return (
      <DemographicForm
        isOpen={true}
        onSubmit={handleDemographicSubmit}
        classId={classId.trim()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Class ID Entry Card */}
        <Card className="border-2 border-gray-200 shadow-lg -mt-8">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-black flex items-center justify-center gap-2">
              <Users size={20} />
              Join Your Class
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">Enter your class ID to access your programming concepts</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="classId" className="text-sm font-medium text-gray-700">
                  Class ID
                </Label>
                <Input
                  id="classId"
                  type="text"
                  placeholder="e.g., CS101-2024"
                  value={classId}
                  onChange={(e) => {
                    setClassId(e.target.value)
                    setError(null) // Clear error when user types
                    setSuccess(null) // Clear success when user types
                  }}
                  className={`border-2 transition-colors ${
                    error 
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-black'
                  }`}
                  disabled={isLoading || !!showSuccess}
                  required
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

              </div>

              <Button
                type="submit"
                disabled={!classId.trim() || isLoading || !!showSuccess}
                className={`w-full transition-colors flex items-center justify-center gap-2 ${
                  showSuccess && !isLoading
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-400'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validating Class...
                  </>
                ) : showSuccess ? (
                  <>
                    <CheckCircle size={16} />
                    Success!
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Need help?</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Ask your instructor for your class ID</li>
                <li>• Class IDs are usually in format: COURSE-YEAR</li>
                <li>• Example: CS101-2024, PYTHON-101, etc.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold text-black">Sophia</span> - Personalized AI Learning
          </p>
        </div>
      </div>
    </div>
  )
}