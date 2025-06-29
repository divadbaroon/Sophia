"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Star } from "lucide-react"

interface UnlockedConceptCardProps {
  title: string
  description: string
  icon: LucideIcon
  difficulty: string
  estimatedTime: string
  isCompleted: boolean
  onClick: () => void
}

export function UnlockedConceptCard({
  title,
  description,
  icon: Icon,
  estimatedTime,
  isCompleted,
  onClick,
}: UnlockedConceptCardProps) {
  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 border-2 bg-white relative overflow-hidden ${
        isCompleted
          ? "border-gray-300 bg-gray-50"
          : "border-gray-200 hover:border-black hover:shadow-lg hover:scale-105"
      }`}
      onClick={onClick}
    >
      {/* Completion Badge - Top Right */}
      {isCompleted && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
            Completed ✓
          </span>
        </div>
      )}

      <CardContent className="p-6 flex flex-col space-y-4 h-full">
        {/* Header with Icon */}
        <div className="flex items-start justify-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isCompleted ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Icon size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 flex-1">
          <h3
            className={`text-xl font-semibold transition-colors ${
              isCompleted ? "text-gray-600" : "text-black group-hover:text-gray-800"
            }`}
          >
            {title}
          </h3>
          <p className={`text-sm leading-relaxed ${isCompleted ? "text-gray-500" : "text-gray-600"}`}>{description}</p>
        </div>

        {/* Stats */}
        <div
          className={`flex items-center justify-between text-xs pt-2 border-t transition-colors ${
            isCompleted ? "text-gray-400 border-gray-200" : "text-gray-500 border-gray-100"
          }`}
        >
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} />
            <span>1 Free Spin</span>
          </div>
        </div>

        {/* Action Text */}
        <div className="pt-2">
          <span
            className={`text-xs font-medium transition-colors ${
              isCompleted ? "text-gray-500 group-hover:text-black" : "text-gray-500 group-hover:text-black"
            }`}
          >
            {isCompleted ? "Click to review →" : "Click to assess →"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
