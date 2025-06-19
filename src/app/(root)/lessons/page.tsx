"use client"

import { useState } from "react"
import { ClassIdEntry } from "@/components/lessons/components/class-id-entry"
import { DemographicForm } from "@/components/lessons/components/demographic-form"
import ConceptLibrary from "@/components/lessons/card-library"

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

  if (!classId) {
    return <ClassIdEntry onClassIdSubmit={handleClassIdSubmit} />
  }

  if (!demographicData) {
    return (
      <>
        <ClassIdEntry onClassIdSubmit={handleClassIdSubmit} />
        <DemographicForm isOpen={showDemographicForm} onSubmit={handleDemographicSubmit} classId={classId} />
      </>
    )
  }

  return <ConceptLibrary />
}
