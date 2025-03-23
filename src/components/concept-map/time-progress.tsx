"use client"

import { ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimeProgressProps {
  timePoints: number
  currentTime: number
  onTimeChange: (time: number) => void
}

export default function TimeProgress({ timePoints, currentTime, onTimeChange }: TimeProgressProps) {
  const handleNextMessage = () => {
    // Move to the next time period, or wrap around to the beginning
    const nextTime = (currentTime + 1) % timePoints
    onTimeChange(nextTime)
  }

  const handlePreviousMessage = () => {
    // Move to the previous time period, or wrap around to the end
    const prevTime = currentTime === 0 ? timePoints - 1 : currentTime - 1
    onTimeChange(prevTime)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePreviousMessage} className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Previous Message
        </Button>

        <div className="font-mono text-sm">
          Student Message: <span className="font-bold">{currentTime + 1}</span>
        </div>

        <Button variant="outline" size="sm" onClick={handleNextMessage} className="flex items-center gap-1">
          Next Message
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

