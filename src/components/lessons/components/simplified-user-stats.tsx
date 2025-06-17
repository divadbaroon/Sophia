"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Target } from "lucide-react"
import type { UserProgress } from "@/types"

interface SimplifiedUserStatsProps {
  userProgress: UserProgress
}

export function SimplifiedUserStats({ userProgress }: SimplifiedUserStatsProps) {
  const getLevel = (xp: number) => Math.floor(xp / 500) + 1
  const getXPForNextLevel = (xp: number) => getLevel(xp) * 500 - xp
  const getLevelProgress = (xp: number) => ((xp % 500) / 500) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-14">
      {/* Progress */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Target size={16} />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-black">{userProgress.completedConcepts.length}</span>
              <span className="text-lg text-gray-500">/ 6 concepts</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-black h-3 rounded-full transition-all duration-500"
                style={{ width: `${(userProgress.completedConcepts.length / 6) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {userProgress.completedConcepts.length === 6
                ? "🎉 All concepts completed!"
                : `${6 - userProgress.completedConcepts.length} concepts remaining`}
            </p>
          </div>
        </CardContent>
      </Card>
        
      {/* Level & XP */}
      <Card className="border-2 border-gray-200 ">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Zap size={16} />
            Level & XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-black">Level {getLevel(userProgress.totalXP)}</span>
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                {userProgress.totalXP} XP
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-black h-3 rounded-full transition-all duration-500"
                style={{ width: `${getLevelProgress(userProgress.totalXP)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {getXPForNextLevel(userProgress.totalXP) === 0
                ? "🎉 Level up! Complete another concept to advance"
                : `${getXPForNextLevel(userProgress.totalXP)} XP to next level`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
