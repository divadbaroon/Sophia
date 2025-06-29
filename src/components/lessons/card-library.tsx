"use client"

import { useState, useEffect, useCallback } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { UnlockedConceptCard } from "@/components/lessons/components/unlocked-concept-card"
import { QuizModal } from "@/components/lessons/components/quiz-modal"
import { InstructionsModal } from "@/components/lessons/components/instructions-modal"

import { getUserClasses } from "@/lib/actions/class-actions"
import { getClassLessons } from "@/lib/actions/lessons-actions"
import { enrollInClass } from "@/lib/actions/class-actions"
import { getQuizQuestions } from "@/lib/actions/quiz-actions"
import { createLearningSession, getUserLearningSessions } from "@/lib/actions/learning-session-actions"

import { Search, Filter, GraduationCap, Variable, ActivityIcon as Function, RotateCcw, GitBranch, Database, Box, Plus, Target, ChevronDown, ChevronUp, Gift } from "lucide-react"

export default function ConceptLibrary() {
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
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

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

  // Session state
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [isRewardsOpen, setIsRewardsOpen] = useState(false)

  // Load completed lessons from database
  const loadCompletedLessons = async (classId?: string) => {
    try {
      const { data: sessions } = await getUserLearningSessions(classId)
      
      if (sessions) {
        // Get lesson IDs for sessions with status 'completed'
        const completedLessonIds = sessions
          .filter(session => session.status === 'completed')
          .map(session => session.lesson_id)
        
        setCompletedLessons(new Set(completedLessonIds))
      }
    } catch (error) {
      console.error('Error loading completed lessons:', error)
    }
  }

  const loadData = useCallback(async () => {
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
              questions: (quizQuestions || []).map((question, index) => ({
                ...question,
                id: question.id || `question-${lesson.id}-${index}`
              }))
            }
          }
        })
      )
      
      setLessons(lessonsWithQuiz)
      
      // Load completed lessons for the first class
      await loadCompletedLessons((classes[0] as any).id)
    }
    
    setLoading(false)
  }, [])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

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
              questions: (quizQuestions || []).map((question, index) => ({
                ...question,
                id: question.id || `question-${lesson.id}-${index}`
              }))
            }
          }
        })
      )
      
      setLessons(lessonsWithQuiz)
      
      // Load completed lessons for the new class
      await loadCompletedLessons(newClass.id)
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

  const handleCardClick = async (lesson: any) => {
    // Prevent multiple clicks while creating session
    if (isCreatingSession) return

    setIsCreatingSession(true)
    setSessionError(null)

    try {
      // Create learning session first
      const sessionResult = await createLearningSession(lesson.id, selectedClass.id)
      
      if (!sessionResult.success) {
        setSessionError(sessionResult.error || "Failed to create learning session")
        setIsCreatingSession(false)
        return
      }

      setSelectedConcept({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        difficulty: lesson.difficulty,
        estimatedTime: `${lesson.estimated_time_mins} min`,
        quiz: lesson.quiz,
        sessionId: sessionResult.data.id 
      })

      // Open quiz modal
      setIsQuizModalOpen(true)
      setIsCreatingSession(false)

    } catch (error) {
      console.error('Error starting lesson:', error)
      setSessionError('An unexpected error occurred. Please try again.')
      setIsCreatingSession(false)
    }
  }

  const handleQuizComplete = async (score: number, conceptTitle: string) => {
    setIsQuizModalOpen(false);
    setCurrentConceptTitle(conceptTitle);
    setIsInstructionsModalOpen(true);
  };

  const handleInstructionsContinue = () => {
    window.location.href = `/concepts/${selectedConcept.id}/session/${selectedConcept.sessionId}`
  }

  // Use real completion status from database
  const isConceptCompleted = (lessonId: string) => {
    return completedLessons.has(lessonId)
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 mt-14">
          <h1 className="text-4xl font-bold text-black mb-4">Concepts</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Assess your understanding of fundamental programming concepts.
          </p>
        </div>

        {/* Class Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJoinModal(true)}
                className="border-2 border-gray-200 hover:border-gray-600 transition-colors p-2 h-8 w-8"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-300 mb-8"></div>

        {/* Error Display */}
        {sessionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{sessionError}</p>
            <button 
              onClick={() => setSessionError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* User stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Rewards & Incentives */}
          <Card className="border-2 border-gray-200 relative hover:border-gray-300 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Gift size={16}/>
                Rewards & Incentives
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsRewardsOpen(!isRewardsOpen)}
                  className="w-full justify-between p-0 h-auto text-left hover:bg-gray-50 rounded-lg px-2 py-1"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-bold text-black">Multiple ways to earn</span>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                        🎁 Prizes
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        💰 Cash
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        🎓 Credit
                      </Badge>
                    </div>
                  </div>
                  
                  {isRewardsOpen ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </Button>

                {/* Dropdown overlay - positioned outside card */}
                {isRewardsOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm p-2 bg-purple-50 rounded-lg border border-purple-100">
                        <span className="text-2xl">🎁</span>
                        <div>
                          <div className="font-medium text-gray-800">Prize spins for $10-$20</div>
                          <div className="text-xs text-gray-600">After each lesson completion</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm p-2 bg-green-50 rounded-lg border border-green-100">
                        <span className="text-2xl">💬</span>
                        <div>
                          <div className="font-medium text-gray-800">$10 for 30-min interview</div>
                          <div className="text-xs text-gray-600">Contact dbarron410@vt.edu</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <div className="font-medium text-gray-800">Extra credit points</div>
                          <div className="text-xs text-gray-600">Guaranteed from professor</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target size={16} />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-black">{completedLessons.size}</span>
                  <span className="text-sm text-gray-500">/ {lessons.length} concepts</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all duration-500"
                    style={{ width: `${lessons.length > 0 ? (completedLessons.size / lessons.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {completedLessons.size === lessons.length && lessons.length > 0
                    ? "🎉 All lessons completed!"
                    : `${lessons.length - completedLessons.size} concepts remaining`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-gray-400 transition-colors"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-gray-200 hover:border-gray-600 transition-colors flex items-center gap-2"
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
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-600"
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
                estimatedTime={`${lesson.estimated_time_mins || 10} min`}
                isCompleted={isConceptCompleted(lesson.id)}
                onClick={() => handleCardClick(lesson)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No concepts found matching your search criteria.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter options.</p>
            </div>
          )}
        </div>

        {/* Loading overlay when creating session */}
        {isCreatingSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                <p className="text-gray-700">Starting your lesson...</p>
              </div>
            </div>
          </div>
        )}

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
                className="flex-1 border-2 border-gray-200 hover:border-gray-600 transition-colors"
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
          sessionId={selectedConcept?.sessionId} 
          quizType="pre" 
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