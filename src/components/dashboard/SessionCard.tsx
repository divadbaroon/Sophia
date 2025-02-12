"use client"

import { useState } from "react"
import { Users, Clock, ArrowRight, LinkIcon, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import SessionDetailsModal from "./utils/SessionDetailsModal"

import { SessionCardProps, ActiveSession, UpcomingSession, PastSession } from "@/types"

export default function SessionCard({ type, data, onUpdate }: SessionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const renderLocation = () => {
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
        return (
          <>
            <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold">{activeData.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  <Badge className="mr-2" variant="outline">{activeData.course.code}</Badge>
                  Active for {activeData.duration} minutes
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-gray-50"
                onClick={() => {
                  navigator.clipboard.writeText("session-invite-link")
                }}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">{activeData.metrics.currentQueue} in queue</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">{activeData.duration} min</span>
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
                  <CardTitle className="text-xl font-bold">{upcomingData.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    <Badge className="mr-2" variant="outline">{upcomingData.course.code}</Badge>
                    {new Date(upcomingData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-gray-50"
                  onClick={() => {
                    navigator.clipboard.writeText("session-invite-link")
                  }}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">{upcomingData.time} ({upcomingData.duration} min)</span>
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
        return (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">{pastData.name}</CardTitle>
              <CardDescription className="text-gray-600">
                <Badge className="mr-2" variant="outline">{pastData.course.code}</Badge>
                {new Date(pastData.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{pastData.metrics.studentsHelped} students helped</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{pastData.duration} min</span>
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
                View Details <ArrowRight />
              </Button>
            </CardFooter>
          </>
        )
      }
    }
  }

  return (
    <Card className="transform transition-all duration-300 hover:shadow-lg">
      {renderContent()}
      <SessionDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        session={data}
      />
    </Card>
  )
}