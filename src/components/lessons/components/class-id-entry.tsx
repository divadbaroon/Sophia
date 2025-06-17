"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Users, ArrowRight } from "lucide-react"

interface ClassIdEntryProps {
  onClassIdSubmit: (classId: string) => void
}

export function ClassIdEntry({ onClassIdSubmit }: ClassIdEntryProps) {
  const [classId, setClassId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId.trim()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onClassIdSubmit(classId.trim())
    setIsLoading(false)
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
                  onChange={(e) => setClassId(e.target.value)}
                  className="border-2 border-gray-200 focus:border-black transition-colors"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={!classId.trim() || isLoading}
                className="w-full bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
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
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Need help?</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Ask your instructor for your class ID</li>
                <li>• Class IDs are usually in format: COURSE-YEAR</li>
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
