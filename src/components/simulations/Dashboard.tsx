"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Session {
  id: string
  studentName: string
  studentAvatar: string
  status: "active" | "completed" | "paused"
  duration: string
  messages: number
  subject: string
  difficulty: "beginner" | "intermediate" | "advanced"
  score: number
  startTime: string
}

const mockSessions: Session[] = [
  {
    id: "1",
    studentName: "Simulated Student 1",
    studentAvatar: "",
    status: "active",
    duration: "12:34",
    messages: 23,
    subject: "Binary Tree Traversal",
    difficulty: "intermediate",
    score: 85,
    startTime: "2:30 PM",
  },
  {
    id: "2",
    studentName: "Simulated Student 2",
    studentAvatar: "",
    status: "active",
    duration: "8:45",
    messages: 15,
    subject: "Binary Search Trees",
    difficulty: "advanced",
    score: 92,
    startTime: "2:45 PM",
  },
  {
    id: "3",
    studentName: "Simulated Student 3",
    studentAvatar: "",
    status: "active",
    duration: "25:12",
    messages: 41,
    subject: "Tree Balancing",
    difficulty: "beginner",
    score: 78,
    startTime: "1:15 PM",
  },
  {
    id: "4",
    studentName: "Simulated Student 4",
    studentAvatar: "",
    status: "active",
    duration: "6:22",
    messages: 9,
    subject: "Binary Tree Insertion",
    difficulty: "intermediate",
    score: 88,
    startTime: "3:00 PM",
  },
]

export default function SimulationsDashboard() {
  const getStatusColor = (status: Session["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "paused":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDifficultyColor = (difficulty: Session["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  const handleRerunSimulation = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsLoading(false)
  }

  const filteredSessions = mockSessions.filter((session) => {
    if (difficultyFilter === "all") return true
    return session.difficulty === difficultyFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header with Rerun Button */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm mt-14">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Simulated Conversation</h1>
              <p className="text-sm text-gray-500">Simulated conversations between your voice agent and simulated students.</p>
            </div>
            <Button
              onClick={handleRerunSimulation}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2"
            >
              {isLoading ? (
                <>
                  Running Simulation...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Rerun Simulation
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <div className="px-6 py-4 border-b">
            <div className="flex gap-2 justify-center">
              <Button
                variant={difficultyFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter("all")}
              >
                All
              </Button>
              <Button
                variant={difficultyFilter === "beginner" ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter("beginner")}
              >
                Beginner
              </Button>
              <Button
                variant={difficultyFilter === "intermediate" ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter("intermediate")}
              >
                Intermediate
              </Button>
              <Button
                variant={difficultyFilter === "advanced" ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter("advanced")}
              >
                Advanced
              </Button>
            </div>
          </div>
          <CardContent className="space-y-4 relative min-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                  <p className="text-gray-600 font-medium">Generating new simulations...</p>
                </div>
              </div>
            ) : (
              filteredSessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${index === 0 ? "mt-6" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{session.studentName}</p>
                      <p className="text-xs text-gray-500">{session.subject}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={getDifficultyColor(session.difficulty)}>
                      {session.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">Score: {session.score}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
