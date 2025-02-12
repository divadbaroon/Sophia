"use client"

import { useState } from "react"
import SessionCard from "../SessionCard"
import SearchHeader from "../utils/SearchHeader"

import { PastSession } from "@/types"
import { pastSessionData, PastfilterOptions } from "@/lib/data/sample_queue_data"

export default function PastSessions() {
  const [pastOfficeHours] = useState<PastSession[]>(pastSessionData)

  return (
    <>
      <SearchHeader
        title="Past Sessions"
        description="Review your previous office hours and feedback"
        showNewButton={false}
        filterOptions={PastfilterOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pastOfficeHours.map((session) => (
          <SessionCard
            key={session.id}
            type="past"
            data={session}
          />
        ))}
      </div>
    </>
  )
}