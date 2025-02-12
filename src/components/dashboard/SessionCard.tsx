"use client"

import { useState, useEffect } from "react"

import { Users, Clock, ArrowRight, LinkIcon, MapPin, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import SessionDetailsModal from "@/components/dashboard/utils/SessionDetailsModal"

import { cn } from "@/lib/utils"

import { SessionCardProps, ActiveSession, UpcomingSession, PastSession } from "@/types"

import { generateDiscussionInviteLink } from "@/lib/actions/links"

export default function SessionCard({ type, data }: SessionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  useEffect(() => {
    if (showCheckmark) {
      const timer = setTimeout(() => {
        setShowCheckmark(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showCheckmark])

  if (!data) {
    return null
  }

  const handleCopyLink = async () => {
    try {
      setIsGeneratingLink(true)
      const { link, error } = await generateDiscussionInviteLink(data.id.toString())
      
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

  const renderCopyButton = () => (
    <Button 
      variant="ghost" 
      size="icon"
      className={cn(
        "relative transition-colors duration-200",
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
    </Button>
  )

  const renderLocation = () => {
    if (!data.location) return null

    return (
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-600" />
        <Badge variant="outline" className="capitalize">
          {data.location.type}
        </Badge>
        <span className="text-sm text-gray-600">{data.location.details}</span>
      </div>
    )
  }

  const renderContent = () => {
    switch (type) {
      case "active": {
        const activeData = data as ActiveSession
        const defaultMetrics = {
          currentQueue: 0,
          totalHelped: 0,
          averageWaitTime: 0,
          activeTime: 0
        }
        const metrics = activeData.metrics ?? defaultMetrics

        return (
          <>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{activeData.name || 'Untitled Session'}</CardTitle>
                  <CardDescription className="text-gray-600">
                    <Badge className="mr-2" variant="outline">
                      {activeData.course?.code || 'No Course'}
                    </Badge>
                    Active for {activeData.duration || 0} minutes
                  </CardDescription>
                </div>
                {renderCopyButton()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{metrics.currentQueue} in queue</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{activeData.duration || 0} min</span>
                  </div>
                  {renderLocation()}
                </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4 mt-2">
              <Button 
                variant="outline" 
                className="hover:bg-gray-50"
                onClick={() => setIsModalOpen(true)}
              >
                Details
              </Button>
              <Button variant="destructive" className="hover:bg-red-700">
                End Session
              </Button>
            </CardFooter>
          </>
        )
      }

      case "upcoming": {
        const upcomingData = data as UpcomingSession
        return (
          <>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{upcomingData.name || 'Untitled Session'}</CardTitle>
                  <CardDescription className="text-gray-600">
                    <Badge className="mr-2" variant="outline">
                      {upcomingData.course?.code || 'No Course'}
                    </Badge>
                    {upcomingData.date ? new Date(upcomingData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No date set'}
                  </CardDescription>
                </div>
                {renderCopyButton()}
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">
                    {upcomingData.time || 'Time not set'} ({upcomingData.duration || 0} min)
                  </span>
                </div>
                {renderLocation()}
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4 mt-2">
              <Button 
                variant="outline" 
                className="hover:bg-gray-50"
                onClick={() => setIsModalOpen(true)}
              >
                Edit
              </Button>
              <Button variant="destructive" className="hover:bg-red-700">
                Cancel Session
              </Button>
            </CardFooter>
          </>
        )
      }

      case "past": {
        const pastData = data as PastSession
        if (!pastData.metrics) {
          return null
        }

        return (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">{pastData.name || 'Untitled Session'}</CardTitle>
              <CardDescription className="text-gray-600">
                <Badge className="mr-2" variant="outline">
                  {pastData.course?.code || 'No Course'}
                </Badge>
                {pastData.date ? new Date(pastData.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'No date set'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{pastData.metrics.studentsHelped || 0} students helped</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{pastData.duration || 0} min</span>
                  </div>
                  {renderLocation()}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="link" 
                className="ml-auto text-blue-600 hover:text-blue-700"
                onClick={() => setIsModalOpen(true)}
              >
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )
      }
    }
  }

  const renderedContent = renderContent()
  if (!renderedContent) {
    return null
  }

  return (
    <Card className="transform transition-all duration-300 hover:shadow-lg">
      {renderedContent}
      <SessionDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        session={data}
      />
    </Card>
  )
}