"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Clock,
  Code,
  FileText,
  AlertTriangle,
  LayoutTemplate,
  Network,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import ConceptTree from "@/components/concept-map/concept-tree"

export default function StudentSessionDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [contextTab, setContextTab] = useState("code")
  const [expandedGaps, setExpandedGaps] = useState<number[]>([])

  const toggleGap = (index: number) => {
    if (expandedGaps.includes(index)) {
      setExpandedGaps(expandedGaps.filter((i) => i !== index))
    } else {
      setExpandedGaps([...expandedGaps, index])
    }
  }

  const sessionData = {
    studentName: "Student",
    sessionTime: "15:30",
    waitTime: "1 min",
    courseInfo: {
      name: "CS101-A: Introduction to Algorithms",
      professor: "Dr. Emily Chen",
      section: "Section 002",
    },
    situationOverview:
      "David is working on the Two Sum problem from LeetCode, which requires finding two numbers in an array that add up to a target value. He's implemented a solution using a dictionary to track seen values, but his code is failing all test cases. The main issue appears to be a fundamental misunderstanding of how dictionaries work in Python, specifically regarding key-value pair management. David has previously struggled with dictionary access patterns and is confused about the proper way to store and retrieve values from a hash map.",
    systemConfidence: 0.82,
    studentCode: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    # Create a dictionary to store values and their indices
    seen = {}
    
    # Iterate through the array with index
    for i, num in enumerate(nums):
        # Calculate the complement needed to reach target
        complement = target - num
        
        # Check if the complement exists in our dictionary
        if complement in seen:
            # Return the indices of the two numbers
            return [seen[complement], i]
        
        # Store the current number and its index
        seen[i] = num  # ERROR: Storing index as key and number as value
    
    # No solution found (though problem guarantees one exists)
    return []`,
    conversationHistory: [
      {
        speaker: "David",
        message: "I'm trying to solve the Two Sum problem but my solution keeps failing all test cases.",
      },
      {
        speaker: "Tutor",
        message: "Can you share your code with me so I can take a look?",
      },
      {
        speaker: "David",
        message: "Sure, here it is. I'm using a dictionary to keep track of values I've seen so far.",
      },
      {
        speaker: "Tutor",
        message: "I see your approach. Can you walk me through how you're using the dictionary in your solution?",
      },
      {
        speaker: "David",
        message:
          "I'm storing each number's index as I go through the array, then checking if the complement exists in the dictionary.",
      },
    ],
    errorDetails: {
      errorMessage: "Test case failed: For input array [2, 7, 11, 15] and target 9, expected [0, 1] but got []",
      lineNumber: 17,
      frequency: "Fails on all test cases",
      explanation:
        "The error occurs because the dictionary is storing values incorrectly. On line 17, the code is using the index (i) as the key and the number (num) as the value. However, when checking if the complement exists in the dictionary with 'if complement in seen', it's looking for the complement as a key, not a value. This key-value reversal means the lookup will never find the complement.",
      codeSnippet: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    # Create a dictionary to store values and their indices
    seen = {}
    
    # Iterate through the array with index
    for i, num in enumerate(nums):
        # Calculate the complement needed to reach target
        complement = target - num
        
        # Check if the complement exists in our dictionary
        if complement in seen:
            # Return the indices of the two numbers
            return [seen[complement], i]
        
        # Store the current number and its index
        seen[i] = num  # ERROR: Storing index as key and number as value
    
    # No solution found (though problem guarantees one exists)
    return []`,
    },
    correctedSolution: {
      code: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    # Create a dictionary to store values and their indices
    seen = {}
    
    # Iterate through the array with index
    for i, num in enumerate(nums):
        # Calculate the complement needed to reach target
        complement = target - num
        
        # Check if the complement exists in our dictionary
        if complement in seen:
            # Return the indices of the two numbers
            return [seen[complement], i]
        
        # Store the current number and its index
        seen[num] = i  # FIXED: Storing number as key and index as value
    
    # No solution found (though problem guarantees one exists)
    return []`,
      explanation:
        "The corrected solution fixes the key-value relationship in the dictionary. Now, we're storing each number (num) as the key and its index (i) as the value. This way, when we check 'if complement in seen', we're correctly looking for the complement number in the dictionary keys. If found, we return the stored index of the complement and the current index, which gives us the two indices whose values sum to the target.",
    },
    context: {
      previousErrors: [
        "Had trouble with dictionary access patterns in past exercises",
        "Confusion about key-value relationships in maps",
      ],
    },
    conceptGaps: [
      {
        concept: "Data Structures",
        subconcept: "Key-Value Pair Management",
        confidence: 0.85,
        description:
          "Student reverses the key-value relationship in the dictionary, storing indices as keys and numbers as values, which makes the complement check ineffective.",
        knowledgeState: {
          understandingLevel: 0.3,
          confidenceInAssessment: 0.9,
          reasoning:
            "Student's code explicitly shows reversed key-value pairs and their conversation confirms misunderstanding of dictionary structure.",
          lastUpdated: "10 minutes ago",
        },
      },
      {
        concept: "Data Structures",
        subconcept: "Dictionary/Map Traversal",
        confidence: 0.75,
        description:
          "Student appears to misunderstand how dictionary lookups work, specifically that the 'in' operator searches keys, not values.",
        knowledgeState: {
          understandingLevel: 0.4,
          confidenceInAssessment: 0.8,
          reasoning:
            "Student's approach to checking for complement suggests they don't fully grasp how the 'in' operator works with dictionaries.",
          lastUpdated: "10 minutes ago",
        },
      },
      {
        concept: "Algorithms",
        subconcept: "Complement Finding",
        confidence: 0.6,
        description:
          "While the student correctly calculates the complement, they don't properly implement the mechanism to find it.",
        knowledgeState: {
          understandingLevel: 0.6,
          confidenceInAssessment: 0.7,
          reasoning:
            "Student understands the concept of finding complements but implementation shows gaps in applying this knowledge.",
          lastUpdated: "12 minutes ago",
        },
      },
      {
        concept: "Data Structures",
        subconcept: "Hash Table Implementation",
        confidence: 0.7,
        description:
          "Student doesn't understand the purpose of using a hash table (dictionary) for O(1) lookups in this algorithm.",
        knowledgeState: {
          understandingLevel: 0.5,
          confidenceInAssessment: 0.75,
          reasoning: "Student is using a dictionary but doesn't leverage its O(1) lookup capabilities correctly.",
          lastUpdated: "12 minutes ago",
        },
      },
    ],
    learningObjectives: [
      "Understanding key-value pair management in dictionaries",
      "Implementing efficient lookups using hash tables",
      "Designing algorithms with appropriate data structures",
      "Complement-based problem solving",
    ],
    suggestedApproach: [
      "Ask about the intended role of the dictionary in their solution",
      "Have them trace through a simple example manually",
      "Focus on what the 'in' operator checks in a dictionary",
      "Guide them to identify the key-value reversal",
    ],
    relatedConcepts: [
      "Hash Function",
      "Time Complexity",
      "Space-Time Tradeoff",
      "Dictionary Lookups",
      "Key-Value Stores",
    ],
    status: "In Progress",
    timeElapsed: "5 minutes",
    previousSessions: [
      {
        date: "2024-02-09",
        topic: "List Comprehensions",
        duration: "30 minutes",
      },
      {
        date: "2024-02-05",
        topic: "Basic Sorting Algorithms",
        duration: "45 minutes",
      },
      {
        date: "2024-01-25",
        topic: "Function Parameters",
        duration: "20 minutes",
      },
    ],
  }

  const navigationItems = [
    { id: "overview", label: "Overview", icon: LayoutTemplate },
    { id: "context", label: "Context", icon: FileText },
    { id: "error", label: "Error", icon: AlertTriangle },
    { id: "solution", label: "Solution", icon: Code },
    { id: "conceptMap", label: "Concept Map", icon: Network },
  ]

  // Function to render code with line numbers
  const renderCodeWithLineNumbers = (code: string) => {
    const lines = code.split("\n")
    return (
      <div className="flex">
        <div className="text-gray-500 pr-4 text-right select-none border-r border-gray-700 mr-4">
          {lines.map((_, i) => (
            <div key={i} className="leading-relaxed">
              {i + 1}
            </div>
          ))}
        </div>
        <div className="flex-1">
          {lines.map((line, i) => (
            <div key={i} className="leading-relaxed">
              {line || " "}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900">{sessionData.courseInfo.name}</h3>
                  <p className="text-gray-600">{sessionData.courseInfo.professor}</p>
                  <p className="text-gray-600">{sessionData.courseInfo.section}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Situation Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">{sessionData.situationOverview}</p>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Concept Gaps</h3>
                  <div className="grid gap-4">
                    {sessionData.conceptGaps.map((gap, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200"
                      >
                        <div
                          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleGap(index)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                gap.knowledgeState.understandingLevel < 0.4
                                  ? "bg-red-500"
                                  : gap.knowledgeState.understandingLevel < 0.7
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                            ></div>
                            <div>
                              <span className="font-medium">{gap.concept}: </span>
                              <span>{gap.subconcept}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold 
                              bg-blue-100 text-blue-600`}
                            >
                              {Math.round(gap.confidence * 100)}%
                            </span>
                            {expandedGaps.includes(index) ? (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                        </div>

                        {expandedGaps.includes(index) && (
                          <div className="p-4 border-t border-gray-200 bg-white">
                            <p className="text-gray-700 mb-4">{gap.description}</p>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-3">Knowledge State</h4>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-gray-600 font-medium">Understanding Level</span>
                                    <span className="text-gray-800 font-semibold">
                                      {Math.round(gap.knowledgeState.understandingLevel * 100)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${
                                        gap.knowledgeState.understandingLevel < 0.4
                                          ? "bg-red-500"
                                          : gap.knowledgeState.understandingLevel < 0.7
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                      }`}
                                      style={{ width: `${gap.knowledgeState.understandingLevel * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-gray-600 font-medium">Assessment Confidence</span>
                                    <span className="text-gray-800 font-semibold">
                                      {Math.round(gap.knowledgeState.confidenceInAssessment * 100)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className="h-2.5 rounded-full bg-blue-600"
                                      style={{ width: `${gap.knowledgeState.confidenceInAssessment * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="text-gray-600 font-medium mb-1">Reasoning</h5>
                                  <p className="text-gray-700 bg-white p-3 rounded border border-gray-200">
                                    {gap.knowledgeState.reasoning}
                                  </p>
                                </div>

                                <div className="text-gray-500 text-sm">
                                  Last updated: {gap.knowledgeState.lastUpdated}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-blue-700">System Confidence</span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                      {Math.round(sessionData.systemConfidence * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "context":
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="border-b pb-2">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setContextTab("code")}
                      className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                        contextTab === "code"
                          ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      Student Code
                    </button>
                    <button
                      onClick={() => setContextTab("conversation")}
                      className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                        contextTab === "conversation"
                          ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      Conversation History
                    </button>
                    <button
                      onClick={() => setContextTab("sessions")}
                      className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                        contextTab === "sessions"
                          ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      Previous Sessions
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contextTab === "code" && (
                  <div className="bg-[#1e1e1e] text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    {renderCodeWithLineNumbers(sessionData.studentCode)}
                  </div>
                )}

                {contextTab === "conversation" && (
                  <div className="space-y-4">
                    {sessionData.conversationHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.speaker === "David" ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"
                        }`}
                      >
                        <div className="font-semibold mb-1">{message.speaker}</div>
                        <div className="text-gray-700">{message.message}</div>
                      </div>
                    ))}
                  </div>
                )}

                {contextTab === "sessions" && (
                  <div>
                    {sessionData.previousSessions.map((session, index) => (
                      <div key={index} className="border-b border-gray-200 last:border-0 py-3">
                        <div className="flex justify-between">
                          <span className="text-gray-700">{session.topic}</span>
                          <span className="text-gray-500">{session.date}</span>
                        </div>
                        <span className="text-sm text-gray-500">{session.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      case "error":
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-[#1e1e1e] text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    {renderCodeWithLineNumbers(sessionData.errorDetails.codeSnippet)}
                  </div>

                  <Alert className="bg-red-50 text-red-800 border-red-200">
                    <AlertDescription>
                      <div className="font-mono">{sessionData.errorDetails.errorMessage}</div>
                      <div className="text-sm mt-1">Line {sessionData.errorDetails.lineNumber}</div>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Error Explanation</h4>
                    <p className="text-gray-700">{sessionData.errorDetails.explanation}</p>
                  </div>

                  <p className="text-gray-700">
                    <span className="font-semibold">Frequency:</span> {sessionData.errorDetails.frequency}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Previous Similar Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {sessionData.context.previousErrors.map((error, index) => (
                    <li key={index} className="text-gray-700">
                      {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )
      case "solution":
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Corrected Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[#1e1e1e] text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
                  {renderCodeWithLineNumbers(sessionData.correctedSolution.code)}
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Solution Explanation</h4>
                  <p className="text-gray-700">{sessionData.correctedSolution.explanation}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Suggested Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {sessionData.suggestedApproach.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1">
                        <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-sm">{index + 1}</span>
                        </div>
                      </div>
                      <span className="ml-3 text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Related Concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sessionData.relatedConcepts.map((concept, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "conceptMap":
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Concept Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                <ConceptTree />
                </div>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent>
              <p className="text-gray-700">Select a section from the sidebar to view content.</p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 relative">
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px",
          opacity: 0.15,
        }}
      />

      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-20 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-blue-50 rounded-full transition-colors">
                <ArrowLeft className="h-6 w-6 text-blue-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sessionData.studentName}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Session Time: {sessionData.sessionTime}</span>
                  <span className="px-2">•</span>
                  <span>Wait Time: {sessionData.waitTime}</span>
                </div>
              </div>
            </div>
  
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm sticky top-48">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-gray-500 px-3 mb-2">Session Progress</h3>
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          activeSection === item.id
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : "text-gray-600 hover:bg-blue-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}

