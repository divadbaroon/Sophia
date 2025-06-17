"use client"

import { useState } from "react"
import { UnlockedConceptCard } from "./components/unlocked-concept-card"
import { QuizModal } from "./components/quiz-modal"
import { InstructionsModal } from "./components/instructions-modal"
import { programmingConcepts } from "@/lib/data/concepts"
import type { UserProgress } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, GraduationCap, Plus } from "lucide-react"
import { AddClassModal } from "@/components/lessons/components/add-class-module"

export default function GamifiedConceptLibrary() {
  const [selectedConcept, setSelectedConcept] = useState<(typeof programmingConcepts)[0] | null>(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false)
  const [currentConceptTitle, setCurrentConceptTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedClass, setSelectedClass] = useState("Python 101")

  const [classes, setClasses] = useState([
    { name: "Python 101", code: "PY101", subject: "Programming" },
    { name: "CS 1114", code: "CS1114", subject: "Computer Science" },
  ])
  const [showAddClassModal, setShowAddClassModal] = useState(false)

  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedConcepts: ["variables", "conditionals"],
    totalXP: 220,
    level: 1,
  })

  const handleCardClick = (concept: (typeof programmingConcepts)[0]) => {
    setSelectedConcept(concept)
    setIsQuizModalOpen(true)
  }

  const handleQuizComplete = (score: number, conceptTitle: string) => {
    setIsQuizModalOpen(false)
    setCurrentConceptTitle(conceptTitle)
    setIsInstructionsModalOpen(true)
    handleConceptComplete(score)
  }

  const handleConceptComplete = (score: number) => {
    if (!selectedConcept || userProgress.completedConcepts.includes(selectedConcept.id)) {
      return
    }

    const newProgress = { ...userProgress }

    // Add to completed concepts
    newProgress.completedConcepts.push(selectedConcept.id)

    // Add XP based on quiz score
    const xpEarned = Math.round((selectedConcept.xpReward * score) / 100)
    newProgress.totalXP += xpEarned

    setUserProgress(newProgress)

  }

  const handleInstructionsContinue = () => {
    // Redirect to homepage after instructions
    window.location.href = "/sessions/12/join"
  }

  const isConceptCompleted = (conceptId: string) => {
    return userProgress.completedConcepts.includes(conceptId)
  }

  const handleAddClass = (classData: any) => {
    const newClass = {
      name: `${classData.code} - ${classData.name}`,
      code: classData.code,
      subject: classData.subject,
    }
    setClasses((prev) => [...prev, newClass])
    setSelectedClass(newClass.name)
  }

  const filterOptions = ["All", "Beginner", "Intermediate", "Advanced", "Completed", "Not Completed"]
  const classOptions = classes.map((cls) => cls.name)

  const filteredConcepts = programmingConcepts.filter((concept) => {
    // Search filter
    const matchesSearch =
      concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concept.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Difficulty filter
    let matchesFilter = true
    if (selectedFilter === "Completed") {
      matchesFilter = isConceptCompleted(concept.id)
    } else if (selectedFilter === "Not Completed") {
      matchesFilter = !isConceptCompleted(concept.id)
    } else if (selectedFilter !== "All") {
      matchesFilter = concept.difficulty === selectedFilter
    }

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative">

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 mt-14">
          <h1 className="text-4xl font-bold text-black mb-4">Lessons</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore our comprehensive collection of programming lessons. Each lesson is designed to build your skills
            step by step.
          </p>
        </div>

        {/* Class Selection - Moved above separator line */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Class:</span>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40 border-2 border-gray-200 focus:border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((classOption) => (
                    <SelectItem key={classOption} value={classOption}>
                      {classOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddClassModal(true)}
                className="border-2 border-gray-200 hover:border-black transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-300 mb-8"></div>

        {/* Search and Filter Section */}
        <div className="mb-6">
          <div className="flex gap-3 items-center">
            {/* Search Bar */}
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

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-gray-200 hover:border-black transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {/* Filter Options */}
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

        {/* Concept Cards Grid - 3 per row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredConcepts.length > 0 ? (
            filteredConcepts.map((concept) => (
              <UnlockedConceptCard
                key={concept.id}
                title={concept.title}
                description={concept.description}
                icon={concept.icon}
                difficulty={concept.difficulty}
                xpReward={concept.xpReward}
                estimatedTime={concept.estimatedTime}
                isCompleted={isConceptCompleted(concept.id)}
                onClick={() => handleCardClick(concept)}
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
            Powered by <span className="font-semibold text-black">Sophia</span> - AI that understands how each student
            thinks
          </p>
        </div>
      </div>

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

      {/* Add Class Modal */}
      <AddClassModal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        onAddClass={handleAddClass}
      />
    </div>
  )
}
