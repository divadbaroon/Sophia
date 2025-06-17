"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Target, BookOpen, Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { useFile } from "@/lib/context/FileContext"
import { conceptIcons } from "@/lib/data/student_tasks"

export default function TaskSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { sessionData, currentMethodIndex, goToNextMethod, goToPrevMethod } = useFile()

  // Show loading state if sessionData not ready
  if (!sessionData || !sessionData.tasks) {
    return (
      <div
        className={`h-full flex items-center justify-center transition-all duration-300 ${isCollapsed ? "w-12" : "w-full"}`}
      >
        {isCollapsed ? (
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="p-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading task information...</p>
          </div>
        )}
      </div>
    )
  }

  const currentTask = sessionData.tasks[currentMethodIndex]
  const concepts = sessionData.conceptMappings[currentMethodIndex] || []
  const progress = ((currentMethodIndex + 1) / sessionData.tasks.length) * 100

  // Mock difficulty level - you can replace this with actual data from your task
  const difficultyLevel = currentTask.difficulty || "Beginner"
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDifficultyIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
      case "easy":
        return <Zap className="h-3 w-3" />
      case "medium":
        return <Target className="h-3 w-3" />
      case "hard":
        return <BookOpen className="h-3 w-3" />
      default:
        return <Target className="h-3 w-3" />
    }
  }

  if (isCollapsed) {
    return (
      <div className="h-full w-12 bg-gradient-to-b from-background to-muted/20 border-r flex flex-col items-center py-4 transition-all duration-300">
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="p-2 mb-4">
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-xs text-muted-foreground writing-mode-vertical transform rotate-180">
            {currentMethodIndex + 1}/{sessionData.tasks.length}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevMethod}
            disabled={currentMethodIndex === 0}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMethod}
            disabled={currentMethodIndex === sessionData.tasks.length - 1}
            className="p-2"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20 transition-all duration-300">
      {/* Header with collapse button - Fixed height */}
      <div className="flex-shrink-0 p-4 pt-3 pb-3 border-b bg-background/80 backdrop-blur-sm -mt-3">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground flex-1">{currentTask.title}</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)} className="p-1 ml-2 shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Difficulty and Concept badges inline */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`${getDifficultyColor(difficultyLevel)} flex items-center gap-1`}>
            {getDifficultyIcon(difficultyLevel)}
            {difficultyLevel}
          </Badge>

          {concepts.length === 0 && (
            <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-800">
              Lambda Functions
            </Badge>
          )}

          {concepts.map((concept) => {
            const conceptInfo = conceptIcons[concept]
            const Icon = conceptInfo?.icon
            return (
              <Badge
                key={concept}
                variant="secondary"
                className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 ${conceptInfo?.className || "bg-primary/10 text-primary hover:bg-primary/20"}`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {concept}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Scrollable content area - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Task Description
              </h3>
              <Card className="p-4 bg-muted/30 border-l-4 border-l-primary">
                <p className="text-sm text-foreground leading-relaxed">{currentTask.description}</p>
              </Card>
            </div>

            <Separator />

            {/* Examples */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Examples</h3>
              <div className="space-y-3">
                {currentTask.examples.map((example, index) => (
                  <Card key={index} className="overflow-hidden border-0 shadow-sm bg-card">
                    <div className="bg-muted/50 px-4 py-2 border-b">
                      <h4 className="text-sm font-medium text-foreground">Example {index + 1}</h4>
                    </div>
                    <div className="p-4">
                      <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto font-mono border">
                        <code className="text-foreground">
                          {Object.entries(example.input).map(([key, value]) => {
                            return typeof value === "string"
                              ? `Input: ${key} = "${value}"\n`
                              : `Input: ${key} = ${JSON.stringify(value)}\n`
                          })}
                          <span className="text-green-600 font-medium">Output: {example.output}</span>
                        </code>
                      </pre>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t bg-background/95 backdrop-blur-sm space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Task Progress</span>
            <span>
              {currentMethodIndex + 1} of {sessionData.tasks.length}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevMethod}
            disabled={currentMethodIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={goToNextMethod}
            disabled={currentMethodIndex === sessionData.tasks.length - 1}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
