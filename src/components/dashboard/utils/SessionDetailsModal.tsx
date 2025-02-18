"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { 
  Clock, 
  Users, 
  Link as LinkIcon, 
  ClipboardCheck,
  Calendar,
  Star,
  BarChart,
  Check
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { queueData } from "@/lib/data/sample_queue_data"

import { cn } from "@/lib/utils"

import { generateDiscussionInviteLink } from "@/lib/actions/links"

import { SessionDetailsModalProps, ActiveSession, UpcomingSession, PastSession } from "@/types"

export default function SessionDetailsModal({ 
  isOpen, 
  onClose, 
  session 
}: SessionDetailsModalProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (showCheckmark) {
      const timer = setTimeout(() => {
        setShowCheckmark(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showCheckmark])

  const handleCopyLink = async () => {
    try {
      setIsGeneratingLink(true)
      const { link, error } = await generateDiscussionInviteLink(session.id.toString())
      
      if (error || !link) {
        console.error('Failed to generate link:', error)
        return
      }

      await navigator.clipboard.writeText(link)
      setShowCheckmark(true)
    } catch (err) {
      console.error('Error copying link:', err)
    } finally {
      setIsGeneratingLink(false)
    }
  }

  // Redirect to the student dashboard when a queued student is clicked
  const handleStudentRedirect = (studentId: string) => {
    if (session && session.id) {
      router.push(`/sessions/${session.id}/${studentId}/`)
    }
  }

  const formatDuration = (minutes: number | undefined | null) => {
    if (!minutes && minutes !== 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center">
        <div>
          <DialogTitle className="text-2xl font-bold">{session?.name || 'Untitled Session'}</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{session?.course?.code || 'No Course Code'}</Badge>
            {session?.status === "active" && (
              <span className="text-sm text-gray-500">
                Active Session
              </span>
            )}
            {session?.status === "upcoming" && (session as UpcomingSession)?.date && (
              <span className="text-sm text-gray-500">
                {new Date((session as UpcomingSession).date).toLocaleDateString()} at {(session as UpcomingSession).time}
              </span>
            )}
            {session?.status === "past" && (session as PastSession)?.date && (
              <span className="text-sm text-gray-500">
                {new Date((session as PastSession).date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className={cn(
              "flex items-center gap-2 mr-7 relative transition-colors duration-200",
              showCheckmark ? "bg-gray-100" : "hover:bg-gray-50",
              isGeneratingLink && "opacity-50 cursor-wait"
            )}
            onClick={handleCopyLink}
            disabled={isGeneratingLink}
          >
            <div className="relative w-4 h-4">
              <LinkIcon className={cn(
                "h-4 w-4 absolute transition-all duration-200",
                showCheckmark ? "opacity-0 scale-75" : "opacity-100 scale-100"
              )} />
              <Check className={cn(
                "h-4 w-4 absolute transition-all duration-200",
                showCheckmark ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )} />
            </div>
            <span className="ml-2">Copy Invite Link</span>
          </Button>
        </div>
      </div>
    )
  }

  const renderMetrics = () => {
    if (session?.status === "active") {
      const metrics = (session as ActiveSession).metrics;
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Active Time</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatDuration(metrics?.activeTime ?? 0)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium">In Queue</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{metrics?.currentQueue ?? 0} students</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Helped Today</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{metrics?.totalHelped ?? 0} students</p>
          </div>
        </div>
      )
    }

    if (session?.status === "upcoming") {
      const upcomingSession = session as UpcomingSession;
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Duration</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{upcomingSession.duration ?? 'N/A'} min</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Expected Attendees</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{upcomingSession.expectedAttendees ?? 'N/A'}</p>
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

    if (session?.status === "past") {
      const pastSession = session as PastSession;
      return (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Students Helped</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{pastSession.metrics?.studentsHelped ?? 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Avg. Wait Time</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{pastSession.metrics?.averageWaitTime ?? 'N/A'}m</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Peak Queue</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{pastSession.metrics?.peakQueueSize ?? 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Rating</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{pastSession.feedback?.averageRating ?? 'N/A'}</p>
          </div>
        </div>
      )
    }
  }

  const renderTabs = () => {
    if (session?.status === "active") {
      return (
        <Tabs defaultValue="queue" className="w-full">
          <TabsList>
            <TabsTrigger value="queue">Queue ({queueData?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="helped">Helped Today</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4 mt-4">
            {queueData?.map((student) => (
              <div 
                key={student.id || `queue-student-1`}  // Use student ID if available, fall back to index-based key
                onClick={() => handleStudentRedirect("queue-student-12345")}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                      <AvatarFallback>{student?.name?.[0] ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student?.name ?? 'Unknown Student'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">Waiting: {student?.waitTime ?? 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Concept Gaps:</p>
                      <p className="text-sm text-gray-500">{student?.conceptGaps?.join(", ") ?? 'None specified'}</p>
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

    if (session?.status === "upcoming") {
      const upcomingSession = session as UpcomingSession;
      return (
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{upcomingSession.description || "No description provided."}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )
    }

    if (session?.status === "past") {
      const pastSession = session as PastSession;
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
                  {pastSession.metrics?.actualStartTime ? 
                    new Date(pastSession.metrics.actualStartTime).toLocaleTimeString() : 'N/A'} - {
                    pastSession.metrics?.actualEndTime ? 
                    new Date(pastSession.metrics.actualEndTime).toLocaleTimeString() : 'N/A'
                  }
                  <br />
                  Total: {pastSession.metrics?.totalDuration ?? 'N/A'} minutes
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            {pastSession.feedback?.comments && (
              <div className="space-y-4 mt-4">
                {pastSession.feedback.comments.map((comment, index) => (
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
