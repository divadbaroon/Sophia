import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { CreateSessionProps } from "@/types"

export default function CreateSession({ onCancel }: CreateSessionProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Create New Session</h1>
          <p className="text-lg text-gray-600">Set up a new office hours session</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Fill in the information for your new office hours session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Session Name</label>
            <Input placeholder="e.g., CS101 Office Hours" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cs101">CS101 - Intro to Programming</SelectItem>
                <SelectItem value="cs201">CS201 - Data Structures</SelectItem>
                <SelectItem value="cs301">CS301 - Algorithms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <Input placeholder="e.g., Room 101 or Zoom Link" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Duration (minutes)</label>
            <Input type="number" placeholder="60" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Input placeholder="Add any additional information for students" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Create Session
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}