import { LayoutDashboard, Clock, History, PlusCircle } from "lucide-react"

import { SidebarProps } from "@/types"

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navigationItems = [
    {
      id: "active",
      name: "Active Sessions",
      icon: LayoutDashboard
    },
    {
      id: "upcoming",
      name: "Upcoming Sessions",
      icon: Clock
    },
    {
      id: "past",
      name: "Past Sessions",
      icon: History
    },
    {
      id: "create",
      name: "Create Session",
      icon: PlusCircle
    }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 fixed h-[calc(100vh-64px)] mt-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-600 mt-2">Manage your sessions</p>
      </div>
      
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}