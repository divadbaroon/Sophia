import { useState } from "react"
import SessionCard from "./SessionCard"
import SearchHeader from "./SearchHeader"

export default function UpcomingSessions() {
  const [upcomingOfficeHours] = useState([
    { id: 1, name: "Data Structures Help Session", date: "2024-02-15", time: "14:00", duration: 90, location: "Room 301" },
    { id: 2, name: "Algorithms Office Hours", date: "2024-02-16", time: "15:30", duration: 120, location: "Zoom" },
    { id: 3, name: "Programming Fundamentals", date: "2024-02-17", time: "10:00", duration: 60, location: "Room 205" }
  ])

  const filterOptions = [
    { value: "all", label: "All Sessions" },
    { value: "this-week", label: "This Week" },
    { value: "next-week", label: "Next Week" }
  ]

  return (
    <>
      <SearchHeader
        title="Upcoming Sessions"
        description="View and manage your scheduled office hours"
        showNewButton={true}
        onNewClick={() => {}} 
        filterOptions={filterOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {upcomingOfficeHours.map((session) => (
          <SessionCard
            key={session.id}
            type="upcoming"
            data={session}
          />
        ))}
      </div>
    </>
  )
}