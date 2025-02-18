"use client"

import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { createSession } from "@/lib/actions/sessions"
import { CreateSessionProps } from "@/types"

type LocationType = 'physical' | 'virtual' | 'hybrid' | ''

interface FormData {
  name: string
  course: {
    id: string
    name: string
    code: string
  }
  description: string
  date: string
  duration: number
  location: {
    type: LocationType
    details: string
  }
}

type FormField = keyof FormData | 'location.details'

export default function CreateSession({ onCancel, onSuccess }: CreateSessionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    course: {
      id: '',
      name: '',
      code: ''
    },
    description: '',
    date: '',
    duration: 60,
    location: {
      type: '',
      details: ''
    }
  })

  const handleInputChange = (field: FormField, value: string | number | { id: string; name: string; code: string }) => {
    setFormData(prev => {
      if (field === 'location.details') {
        return {
          ...prev,
          location: {
            ...prev.location,
            details: value as string
          }
        }
      }
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleLocationChange = (type: LocationType) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        type
      }
    }))
  }

  const handleSubmit = async () => {
    if (!formData.location.type) {
      setError('Please select a location type')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await createSession({
        ...formData,
        location: {
          type: formData.location.type,
          details: formData.location.details
        }
      })

      if (result.error) {
        setError(result.error)
        return
      }

      onSuccess()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Create New Session</h1>
          <p className="text-lg text-gray-600">Set up a new office hours session</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-5xl mx-auto">
        <CardContent className="space-y-6">
          <div className="space-y-4 mt-5">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Session Name</label>
              <Input 
                className="focus-visible:ring-0 focus-visible:ring-offset-0" 
                placeholder="e.g., CS101 Office Hours" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Course</label>
              <Select 
                value={formData.course.id}
                onValueChange={(value) => {
                  const course = {
                    id: value,
                    name: value === 'cs101' ? 'Intro to Programming' : 
                          value === 'cs201' ? 'Data Structures' : 'Algorithms',
                    code: value.toUpperCase()
                  }
                  handleInputChange('course', course)
                }}
              >
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
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>

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
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(new Date(formData.date), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) => handleInputChange('date', date?.toISOString() ?? '')}
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
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            <RadioGroup 
              defaultValue=""
              value={formData.location.type}
              onValueChange={(value: LocationType) => handleLocationChange(value)}
              className="grid grid-cols-3 gap-4"
            >
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
                value={formData.location.details}
                onChange={(e) => handleInputChange('location.details', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Session'}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}