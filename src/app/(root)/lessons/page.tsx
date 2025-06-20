"use client"

import { useState, useEffect } from "react"
import { ClassIdEntry } from "@/components/lessons/components/class-id-entry"
import { DemographicForm } from "@/components/lessons/components/demographic-form"
import ConceptLibrary from "@/components/lessons/card-library"
import { getUserClasses } from "@/lib/actions/class-actions"

export default function Page() {
  const [userClasses, setUserClasses] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [classId, setClassId] = useState<string | null>(null)
  const [showDemographicForm, setShowDemographicForm] = useState(false)
  const [demographicData, setDemographicData] = useState(null)

  // Check for user's classes on component mount
  useEffect(() => {
    const checkUserClasses = async () => {
      const { data: classes, error } = await getUserClasses()
      
      if (error) {
        console.error('Error fetching user classes:', error)
        setUserClasses([]) // No classes
      } else {
        setUserClasses(classes)
      }
      
      setLoading(false)
    }

    checkUserClasses()
  }, [])

  const handleClassIdSubmit = (id: string) => {
    setClassId(id)
    setShowDemographicForm(true)
  }

  const handleDemographicSubmit = (data: any) => {
    setDemographicData(data)
    setShowDemographicForm(false)
    console.log("Demographic data submitted:", data)
  }

   // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center space-y-4">
          {/* Loading Spinner */}
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // If user has no classes, show dialog for them to join a class
  if (!userClasses || userClasses.length === 0) {
    return <ClassIdEntry onClassIdSubmit={handleClassIdSubmit} />
  }

  // User has classes and data - show ConceptLibrary
  return <ConceptLibrary />
}