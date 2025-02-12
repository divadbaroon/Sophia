"use client"

import { 
  Clock, 
  Users, 
  Link as LinkIcon, 
  ClipboardCheck,
  Calendar,
  Star,
  BarChart
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { SessionDetailsModalProps } from "@/types"

import { queueData } from "@/lib/data/sample_queue_data"

export default function SessionDetailsModal({ 
  isOpen, 
  onClose, 
  session 
}: SessionDetailsModalProps) {

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center">
        <div>
          <DialogTitle className="text-2xl font-bold">{session.name}</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{session.course.code}</Badge>
            {session.status === "active" && (
              <span className="text-sm text-gray-500">
                {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.expectedEndTime).toLocaleTimeString()}
              </span>
            )}
            {session.status === "upcoming" && (
              <span className="text-sm text-gray-500">
                {new Date(session.date).toLocaleDateString()} at {session.time}
              </span>
            )}
            {session.status === "past" && (
              <span className="text-sm text-gray-500">
                {new Date(session.date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 mr-7"
            onClick={() => {
              navigator.clipboard.writeText("session-invite-link")
            }}
          >
            <LinkIcon className="h-4 w-4" />
            Copy Invite Link
          </Button>
        </div>
      </div>
    )
  }

  const renderMetrics = () => {
    if (session.status === "active") {
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Active Time</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{Math.floor(session.metrics.activeTime / 60)}h {session.metrics.activeTime % 60}m</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium">In Queue</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.metrics.currentQueue} students</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Helped Today</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.metrics.totalHelped} students</p>
          </div>
        </div>
      )
    }

    if (session.status === "upcoming") {
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Duration</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.duration} min</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Expected Attendees</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.expectedAttendees || "N/A"}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Time Until Start</span>
            </div>
            <p className="mt-2 text-2xl font-bold">2h 30m</p>
          </div>
        </div>
      )
    }

    if (session.status === "past") {
      return (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Students Helped</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.metrics.studentsHelped}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Avg. Wait Time</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.metrics.averageWaitTime}m</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Peak Queue</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.metrics.peakQueueSize}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Rating</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{session.feedback?.averageRating || "N/A"}</p>
          </div>
        </div>
      )
    }
  }

  const renderTabs = () => {
    if (session.status === "active") {
      return (
        <Tabs defaultValue="queue" className="w-full">
          <TabsList>
            <TabsTrigger value="queue">Queue ({queueData.length})</TabsTrigger>
            <TabsTrigger value="helped">Helped Today</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4 mt-4">
            {queueData.map((student) => (
              <div 
                key={student.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">Waiting: {student.waitTime}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Concept Gaps:</p>
                      <p className="text-sm text-gray-500">{student.conceptGaps.join(", ")}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="helped">
            {/* List of helped students */}
          </TabsContent>
        </Tabs>
      )
    }

    if (session.status === "upcoming") {
      return (
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{session.description || "No description provided."}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )
    }

    if (session.status === "past") {
      return (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Session Duration</h3>
                <p className="text-gray-600">
                  {new Date(session.metrics.actualStartTime).toLocaleTimeString()} - {new Date(session.metrics.actualEndTime).toLocaleTimeString()}
                  <br />
                  Total: {session.metrics.totalDuration} minutes
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            {session.feedback?.comments && (
              <div className="space-y-4 mt-4">
                {session.feedback.comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">"{comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {/* Detailed analytics */}
          </TabsContent>
        </Tabs>
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {renderHeader()}
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {renderMetrics()}
          {renderTabs()}
        </div>
      </DialogContent>
    </Dialog>
  )
}