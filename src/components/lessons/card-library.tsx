"use client"

import { useState, useEffect } from "react"
import { UnlockedConceptCard } from "@/components/lessons/components/unlocked-concept-card"
import { QuizModal } from "@/components/lessons/components/quiz-modal"
import { InstructionsModal } from "@/components/lessons/components/instructions-modal"
import { getUserClasses } from "@/lib/actions/class-actions"
import { getClassLessons } from "@/lib/actions/lessons-actions"
import { enrollInClass } from "@/lib/actions/class-actions"
import { getQuizQuestions } from "@/lib/actions/quiz-actions"
import type { UserProgress } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Filter, GraduationCap, Variable, ActivityIcon as Function, RotateCcw, GitBranch, Database, Box, Plus, X } from "lucide-react"

export default function GamifiedConceptLibrary() {
  // Icon mapping for database icon names to Lucide components
  const iconMap: { [key: string]: any } = {
    'Variable': Variable,
    'ActivityIcon': Function,
    'RotateCcw': RotateCcw,
    'GitBranch': GitBranch,
    'Database': Database,
    'Box': Box
  }

  // Database state
  const [userClasses, setUserClasses] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Existing UI state
  const [selectedConcept, setSelectedConcept] = useState<any | null>(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false)
  const [currentConceptTitle, setCurrentConceptTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [showFilters, setShowFilters] = useState(false)

  // Join class modal state
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [classCode, setClassCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedConcepts: [],
    totalXP: 0,
    level: 1,
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Get user's classes
    const { data: classes } = await getUserClasses()
    
    if (classes && classes.length > 0) {
      setUserClasses(classes)
      setSelectedClass(classes[0])
      
      // Get lessons for first class
      const { data: classLessons } = await getClassLessons((classes[0] as any).id)
      
      // Fetch quiz questions for all lessons
      const lessonsWithQuiz = await Promise.all(
        (classLessons || []).map(async (lesson) => {
          const { data: quizQuestions } = await getQuizQuestions(lesson.id)
          return {
            ...lesson,
            quiz: {
              title: lesson.title,
              questions: quizQuestions || []
            }
          }
        })
      )
      
      setLessons(lessonsWithQuiz)
    }
    
    setLoading(false)
  }

  // Handle class change
  const handleClassChange = async (classCode: string) => {
    const newClass = userClasses.find(cls => cls.class_code === classCode)
    if (newClass) {
      setSelectedClass(newClass)
      const { data: classLessons } = await getClassLessons(newClass.id)
      
      // Fetch quiz questions for all lessons in the new class
      const lessonsWithQuiz = await Promise.all(
        (classLessons || []).map(async (lesson) => {
          const { data: quizQuestions } = await getQuizQuestions(lesson.id)
          return {
            ...lesson,
            quiz: {
              title: lesson.title,
              questions: quizQuestions || []
            }
          }
        })
      )
      
      setLessons(lessonsWithQuiz)
    }
  }

  // Handle joining a class
  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classCode.trim()) return

    setIsJoining(true)
    setJoinError(null)

    try {
      const result = await enrollInClass(classCode.trim())
      
      if (!result.success) {
        setJoinError(result.error || "Failed to join class")
        setIsJoining(false)
        return
      }

      // Success! Refresh classes and close modal
      await loadData()
      setShowJoinModal(false)
      setClassCode("")
      setIsJoining(false)

    } catch (error) {
      console.error('Class join error:', error)
      setJoinError('An unexpected error occurred. Please try again.')
      setIsJoining(false)
    }
  }

  const handleCardClick = (lesson: any) => {
    setSelectedConcept({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      estimatedTime: `${lesson.estimated_time_mins} min`,
      xpReward: 100,
      quiz: lesson.quiz 
    })
    setIsQuizModalOpen(true)
  }

  const handleQuizComplete = (score: number, conceptTitle: string) => {
    setIsQuizModalOpen(false)
    setCurrentConceptTitle(conceptTitle)
    setIsInstructionsModalOpen(true)
    handleConceptComplete()
  }

  const handleConceptComplete = () => {
    if (!selectedConcept || userProgress.completedConcepts.includes(selectedConcept.id)) {
      return
    }

    const newProgress = { ...userProgress }
    newProgress.completedConcepts.push(selectedConcept.id)
    newProgress.totalXP += 100
    setUserProgress(newProgress)
  }

  const handleInstructionsContinue = () => {
    window.location.href = `/lessons/${selectedConcept?.id}/session`
  }

  const isConceptCompleted = (lessonId: string) => {
    return userProgress.completedConcepts.includes(lessonId)
  }

  const filterOptions = ["All", "Beginner", "Intermediate", "Advanced", "Completed", "Not Completed"]

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesFilter = true
    if (selectedFilter === "Completed") {
      matchesFilter = isConceptCompleted(lesson.id)
    } else if (selectedFilter === "Not Completed") {
      matchesFilter = !isConceptCompleted(lesson.id)
    } else if (selectedFilter !== "All") {
      matchesFilter = lesson.difficulty === selectedFilter
    }

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your lessons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 mt-14">
          <h1 className="text-4xl font-bold text-black mb-4">Lessons</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore your programming lessons. Each lesson is designed to build your skills step by step.
          </p>
        </div>

        {/* Class Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Class:</span>
              <Select value={selectedClass?.class_code || ""} onValueChange={handleClassChange}>
                <SelectTrigger className="w-40 border-2 border-gray-200 focus:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.class_code}>
                      {cls.class_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowJoinModal(true)}
              className="border-2 border-gray-200 hover:border-black transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Join Class
            </Button>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-300 mb-8"></div>

        {/* Search and Filter Section */}
        <div className="mb-6">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-black transition-colors"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-gray-200 hover:border-black transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedFilter === filter
                        ? "bg-black text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-black"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lesson Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson) => (
              <UnlockedConceptCard
                key={lesson.id}
                title={lesson.title}
                description={lesson.description || ""}
                icon={iconMap[lesson.icon_name] || Variable} 
                difficulty={lesson.difficulty || "Beginner"}
                xpReward={100}
                estimatedTime={`${lesson.estimated_time_mins || 10} min`}
                isCompleted={isConceptCompleted(lesson.id)}
                onClick={() => handleCardClick(lesson)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No lessons found matching your search criteria.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter options.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-8">
          <p className="text-gray-500 text-sm">
            Powered by <span className="font-semibold text-black">Sophia</span> - AI that understands how each student thinks
          </p>
        </div>
      </div>

      {/* Join Class Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-md bg-white border-2 border-black">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-black">Join Class</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleJoinClass} className="space-y-4 pt-4">
            <div className="space-y-2 -mt-3">
              <Label htmlFor="classCode">Class Code *</Label>
              <Input
                id="classCode"
                type="text"
                placeholder="e.g., CS101-2024"
                value={classCode}
                onChange={(e) => {
                  setClassCode(e.target.value)
                  setJoinError(null)
                }}
                className={`border-2 transition-colors ${
                  joinError 
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-black'
                }`}
                disabled={isJoining}
                required
              />
              {joinError && (
                <div className="text-sm text-red-600">
                  {joinError}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowJoinModal(false)
                  setClassCode("")
                  setJoinError(null)
                }}
                className="flex-1 border-2 border-gray-200 hover:border-black transition-colors"
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!classCode.trim() || isJoining}
                className="flex-1 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Join Class
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        concept={selectedConcept?.quiz || null}
        onComplete={handleQuizComplete}
      />

      <InstructionsModal
        isOpen={isInstructionsModalOpen}
        onClose={() => setIsInstructionsModalOpen(false)}
        conceptTitle={currentConceptTitle}
        onContinue={handleInstructionsContinue}
      />
    </div>
  )
}