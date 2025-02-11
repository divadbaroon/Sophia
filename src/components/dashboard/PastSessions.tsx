import { useState } from "react"
import SessionCard from "./SessionCard"
import SearchHeader from "./SearchHeader"

export default function PastSessions() {
  const [pastOfficeHours] = useState([
    { id: 1, name: "Data Structures Review", studentsHelped: 12, date: "2023-06-01", duration: 120 },
    { id: 2, name: "Algorithm Design", studentsHelped: 8, date: "2023-05-28", duration: 90 },
    { id: 3, name: "Database Systems", studentsHelped: 15, date: "2023-05-25", duration: 150 },
    { id: 4, name: "Web Development Basics", studentsHelped: 10, date: "2023-05-22", duration: 105 },
    { id: 5, name: "Machine Learning Concepts", studentsHelped: 7, date: "2023-05-19", duration: 135 },
    { id: 6, name: "Computer Networks", studentsHelped: 9, date: "2023-05-16", duration: 110 }
  ])

  const filterOptions = [
    { value: "all", label: "All Sessions" },
    { value: "high-attendance", label: "High Attendance" },
    { value: "long-duration", label: "Long Duration" }
  ]

  return (
    <>
      <SearchHeader
        title="Past Sessions"
        description="Review your previous office hours"
        showNewButton={false}
        filterOptions={filterOptions}
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