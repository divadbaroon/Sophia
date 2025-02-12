"use client"

import { useState } from "react"
import SessionCard from "../SessionCard"
import SearchHeader from "../utils/SearchHeader"

import { ActiveSession } from "@/types"
import { activeSessionData, filterOptions } from "@/lib/data/sample_queue_data"

export default function ActiveSessions() {
  const [activeOfficeHours] = useState<ActiveSession[]>(activeSessionData)

  return (
    <>
      <SearchHeader
        title="Active Sessions"
        description="Monitor and manage your ongoing office hours"
        showNewButton={true}
        onNewClick={() => {}} 
        filterOptions={filterOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeOfficeHours.map((session) => (
          <SessionCard
            key={session.id}
            type="active"
            data={session}
          />
        ))}
      </div>
    </>
  )
}