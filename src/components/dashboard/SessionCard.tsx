import { Users, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import { SessionCardProps } from "@/types"

export default function SessionCard({ type, data }: SessionCardProps) {
  const renderContent = () => {
    switch (type) {
      case "active":
        return (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">{data.name}</CardTitle>
              <CardDescription className="text-gray-600">
                Active for {data.duration} minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{data.students} students</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="font-medium">{data.duration} min</span>
                  </div>
                </div>
                <Progress value={33} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" className="hover:bg-gray-50">
                View Queue
              </Button>
              <Button variant="destructive" className="hover:bg-red-700">
                End Session
              </Button>
            </CardFooter>
          </>
        )

      case "upcoming":
        return (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">{data.name}</CardTitle>
              <CardDescription className="text-gray-600">
                {new Date(data.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">{data.time} ({data.duration} min)</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">{data.location}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" className="hover:bg-gray-50">
                Edit
              </Button>
              <Button variant="destructive" className="hover:bg-red-700">
                Cancel Session
              </Button>
            </CardFooter>
          </>
        )

      case "past":
        return (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">{data.name}</CardTitle>
              <CardDescription className="text-gray-600">
                {new Date(data.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">{data.studentsHelped} students helped</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-600" />
                  <span className="font-medium">{data.duration} min</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="link" 
                className="ml-auto text-blue-600 hover:text-blue-700"
              >
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )
    }
  }

  return (
    <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white">
      {renderContent()}
    </Card>
  )
}