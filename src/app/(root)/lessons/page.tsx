"use client"

import { useState } from "react"
import { ClassIdEntry } from "@/components/lessons/components/class-id-entry"
import { DemographicForm } from "@/components/lessons/components/demographic-form"
import GamifiedConceptLibrary from "@/components/lessons/gamified-card-library"

export default function Page() {
  const [classId, setClassId] = useState<string | null>(null)
  const [showDemographicForm, setShowDemographicForm] = useState(false)
  const [demographicData, setDemographicData] = useState(null)

  const handleClassIdSubmit = (id: string) => {
    setClassId(id)
    setShowDemographicForm(true)
  }

  const handleDemographicSubmit = (data: any) => {
    setDemographicData(data)
    setShowDemographicForm(false)
    console.log("Demographic data submitted:", data)
  }

  // Show class ID entry first
  if (!classId) {
    return <ClassIdEntry onClassIdSubmit={handleClassIdSubmit} />
  }

  // Show demographic form after class ID is entered, but before joining class
  if (!demographicData) {
    return (
      <>
        <ClassIdEntry onClassIdSubmit={handleClassIdSubmit} />
        <DemographicForm isOpen={showDemographicForm} onSubmit={handleDemographicSubmit} classId={classId} />
      </>
    )
  }

  // Finally show the lesson library after demographic form is completed
  return <GamifiedConceptLibrary />
}
