"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

import { CreateSessionProps } from "@/types"

export default function CreateSession({ onCancel }: CreateSessionProps) {
  const [date, setDate] = useState<Date>()

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Create New Session</h1>
          <p className="text-lg text-gray-600">Set up a new office hours session</p>
        </div>
      </div>

      <Card className="max-w-5xl mx-auto">

        <CardContent className="space-y-6">
          
          <div className="space-y-4 mt-5">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Session Name</label>
              <Input 
                className="focus-visible:ring-0 focus-visible:ring-offset-0" 
                placeholder="e.g., CS101 Office Hours" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Course</label>
              <Select>
                <SelectTrigger className="focus-visible:ring-transparent">
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
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Textarea 
                className="focus-visible:ring-0 focus-visible:ring-offset-0" 
                placeholder="Add details about what will be covered in this session" 
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duration (minutes)</label>
                <Input 
                className="focus-visible:ring-0 focus-visible:ring-offset-0" 
                type="number" 
                placeholder="60" 
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            <RadioGroup defaultValue="physical" className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="physical" id="physical" className="peer sr-only" />
                <Label
                  htmlFor="physical"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  Physical
                </Label>
              </div>
              <div>
                <RadioGroupItem value="virtual" id="virtual" className="peer sr-only" />
                <Label
                  htmlFor="virtual"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  Virtual
                </Label>
              </div>
              <div>
                <RadioGroupItem value="hybrid" id="hybrid" className="peer sr-only" />
                <Label
                  htmlFor="hybrid"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  Hybrid
                </Label>
              </div>
            </RadioGroup>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location Details</label>
              <Input 
              className="focus-visible:ring-0 focus-visible:ring-offset-0" 
              placeholder="Room number, Zoom link, or both for hybrid" 
              />
            </div>
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