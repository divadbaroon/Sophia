"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EditSessionModalProps, UpcomingSession } from "@/types"

export default function EditSessionModal({ 
  isOpen, 
  onClose, 
  session,
  onUpdate 
}: EditSessionModalProps) {
  const [editedSession, setEditedSession] = useState<UpcomingSession>(session)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(editedSession)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Session Name</Label>
              <Input
                value={editedSession.name}
                onChange={(e) => setEditedSession(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={editedSession.date.split('T')[0]}
                onChange={(e) => setEditedSession(prev => ({
                  ...prev,
                  date: new Date(e.target.value).toISOString()
                }))}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={editedSession.time}
                onChange={(e) => setEditedSession(prev => ({
                  ...prev,
                  time: e.target.value
                }))}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={editedSession.duration}
                onChange={(e) => setEditedSession(prev => ({
                  ...prev,
                  duration: parseInt(e.target.value)
                }))}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div>
              <Label>Location Type</Label>
              <RadioGroup
                value={editedSession.location.type}
                onValueChange={(value: "physical" | "virtual" | "hybrid") => 
                  setEditedSession(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      type: value
                    }
                  }))
                }
                className="grid grid-cols-3 gap-4 mt-2"
              >
                {["physical", "virtual", "hybrid"].map((type) => (
                  <div key={type}>
                    <RadioGroupItem value={type} id={type} className="peer sr-only" />
                    <Label
                      htmlFor={type}
                      className="flex flex-col items-center justify-between rounded-md border border-gray-200 bg-transparent p-4 hover:bg-gray-50 hover:text-gray-700 peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 capitalize cursor-pointer"
                    >
                      {type}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>Location Details</Label>
              <Input
                value={editedSession.location.details}
                onChange={(e) => setEditedSession(prev => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    details: e.target.value
                  }
                }))}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Room number or Zoom link"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}