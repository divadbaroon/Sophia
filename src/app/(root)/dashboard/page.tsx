"use client"

import { useState } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import ActiveSessions from "@/components/dashboard/active/ActiveSessions"
import UpcomingSessions from "@/components/dashboard/upcoming/UpcomingSessions"
import PastSessions from "@/components/dashboard/past/PastSessions"
import CreateSession from "@/components/dashboard/create/CreateSession"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("active")

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-8 ml-64 mt-16">
        {activeTab === "active" && <ActiveSessions />}
        {activeTab === "upcoming" && <UpcomingSessions />}
        {activeTab === "past" && <PastSessions />}
        {activeTab === "create" && <CreateSession onCancel={() => setActiveTab("active")} />}
      </div>
    </div>
  )
}