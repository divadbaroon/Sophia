"use client"

import { useState } from "react"
import SessionCard from "../SessionCard"
import SearchHeader from "../utils/SearchHeader"

import { UpcomingSession } from "@/types"
import { upcomingSessionData, UpcomingfilterOptions} from "@/lib/data/sample_queue_data"

export default function UpcomingSessions() {
  const [upcomingOfficeHours, setUpcomingOfficeHours] = useState<UpcomingSession[]>(upcomingSessionData)

  const handleUpdateSession = (updatedSession: UpcomingSession) => {
    setUpcomingOfficeHours(prev => 
      prev.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      )
    )
  }

  return (
    <>
      <SearchHeader
        title="Upcoming Sessions"
        description="View and manage your scheduled office hours"
        showNewButton={true}
        onNewClick={() => {}} 
        filterOptions={UpcomingfilterOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {upcomingOfficeHours.map((session) => (
          <SessionCard
            key={session.id}
            type="upcoming"
            data={session}
            onUpdate={{
              upcoming: handleUpdateSession
            }}
          />
        ))}
      </div>
    </>
  )
}