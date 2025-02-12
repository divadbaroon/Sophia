"use client"

import { useState, useEffect } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"

import Sidebar from "@/components/dashboard/Sidebar"
import ActiveSessions from "@/components/dashboard/active/ActiveSessions"
import UpcomingSessions from "@/components/dashboard/upcoming/UpcomingSessions"
import PastSessions from "@/components/dashboard/past/PastSessions"
import CreateSession from "@/components/dashboard/create/CreateSession"

import { getAllSessions } from "@/lib/actions/sessions"

import { Session, ActiveSession, UpcomingSession, PastSession } from "@/types"


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("active")
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const result = await getAllSessions()

      if (result.error) {
        setError(result.error)
        console.error('Error:', result.error)
        return
      }

      if (result.success && result.data) {
        console.log('Fetched sessions:', result.data)
        setSessions(result.data as Session[])
      }
    } catch (err) {
      setError('Failed to fetch sessions')
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  // Filter data based on type

  const activeSessions = sessions.filter((session): session is ActiveSession => 
    session.status === 'active'
  )
  
  const upcomingSessions = sessions.filter((session): session is UpcomingSession => 
    session.status === 'upcoming'
  )
  
  const pastSessions = sessions.filter((session): session is PastSession => 
    session.status === 'past'
  )

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-8 ml-64 mt-16">
        {activeTab === "active" && (
          <ActiveSessions 
            sessions={activeSessions} 
            isLoading={isLoading} 
          />
        )}
        {activeTab === "upcoming" && (
          <UpcomingSessions 
            sessions={upcomingSessions} 
            isLoading={isLoading}
            onUpdate={fetchSessions}
          />
        )}
        {activeTab === "past" && (
          <PastSessions 
            sessions={pastSessions} 
            isLoading={isLoading} 
          />
        )}
        {activeTab === "create" && (
          <CreateSession 
            onCancel={() => setActiveTab("active")}
            onSuccess={() => {
              fetchSessions()
              setActiveTab("upcoming")
            }}
          />
        )}
      </div>
    </div>
  )
}