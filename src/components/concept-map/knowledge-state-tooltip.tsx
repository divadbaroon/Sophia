"use client"

import { useState } from "react"
import { Info } from "lucide-react"

interface KnowledgeState {
  understandingLevel: number
  confidenceInAssessment: number
  reasoning: string
  lastUpdated: string
}

interface KnowledgeStateTooltipProps {
  knowledgeState: KnowledgeState
}

export default function KnowledgeStateTooltip({ knowledgeState }: KnowledgeStateTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { understandingLevel, confidenceInAssessment, reasoning, lastUpdated } = knowledgeState

  return (
    <div className="relative inline-block">
      <span
        className="ml-1 inline-flex items-center justify-center rounded-full h-4 w-4 text-muted-foreground hover:text-foreground cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <Info className="h-3 w-3" />
        <span className="sr-only">View knowledge state</span>
      </span>

      {isVisible && (
        <div className="absolute left-full top-0 ml-2 z-50 w-80 p-4 text-xs rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="space-y-2">
            <div className="font-medium">Knowledge State</div>

            <div className="grid grid-cols-2 gap-1">
              <div className="text-muted-foreground">Understanding Level:</div>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${understandingLevel * 100}%` }} />
                </div>
                <span>{understandingLevel.toFixed(2)}</span>
              </div>

              <div className="text-muted-foreground">Confidence:</div>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${confidenceInAssessment * 100}%` }} />
                </div>
                <span>{confidenceInAssessment.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Reasoning:</div>
              <p className="mt-1">{reasoning}</p>
            </div>

            <div className="text-muted-foreground text-[10px]">Last updated: {lastUpdated}</div>
          </div>
        </div>
      )}
    </div>
  )
}

