import { useState } from "react"
import SessionCard from "./SessionCard"
import SearchHeader from "./SearchHeader"

export default function ActiveSessions() {
  const [activeOfficeHours] = useState([
    { id: 1, name: "CS101 Office Hours", students: 5, duration: 45 }
  ])

  const filterOptions = [
    { value: "all", label: "All Sessions" },
    { value: "high-attendance", label: "High Attendance" },
    { value: "long-duration", label: "Long Duration" }
  ]

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