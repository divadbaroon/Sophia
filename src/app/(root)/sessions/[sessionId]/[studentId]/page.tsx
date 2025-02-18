"use client"

import React, { useState } from 'react';
import { ArrowLeft, Clock, Code, MessageSquare, FileText, AlertTriangle, LayoutTemplate, BookOpen, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StudentSessionDashboard() {
  const [activeSection, setActiveSection] = useState('overview');

  const sessionData = {
    studentName: "John Doe",
    sessionTime: "15:30",
    waitTime: "10 min",
    courseInfo: {
      name: "CS201: Data Structures & Algorithms",
      professor: "Dr. Sarah Johnson",
      section: "Section 003",
    },
    question: "I'm getting an IndexError in my recursive binary search implementation. The function sometimes works but crashes with large arrays. I think the issue is in how I'm calculating the midpoint.",
    errorDetails: {
      errorMessage: "IndexError: list index out of range",
      lineNumber: 15,
      frequency: "Occurs with arrays longer than 1000 elements",
      codeSnippet: `def binary_search(arr, target, left=0, right=None):
    if right is None:
        right = len(arr)
    
    if left >= right:
        return -1
        
    mid = (left + right) // 2  # Potential issue here
    
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search(arr, target, mid + 1, right)
    else:
        return binary_search(arr, target, left, mid - 1)`,
    },
    context: {
      priorKnowledge: [
        "Basic understanding of recursion",
        "Completed assignments on linear search",
        "Familiar with Python list operations"
      ],
      recentTopics: [
        "Time complexity analysis",
        "Recursive functions",
        "Binary search theory"
      ],
      previousErrors: [
        "Had trouble with base cases in recursive functions",
        "Struggled with array indexing in past assignments"
      ]
    },
    learningObjectives: [
      "Understanding recursive base cases",
      "Array index manipulation",
      "Binary search implementation best practices",
      "Edge case handling in recursive functions",
      "Time and space complexity analysis"
    ],
    suggestedApproach: [
      "Review the base case conditions",
      "Analyze the midpoint calculation",
      "Test with boundary conditions",
      "Compare with iterative implementation"
    ],
    practiceExercises: [
      {
        title: "Edge Cases in Binary Search",
        difficulty: "Medium",
        description: "Implement binary search for arrays with duplicate elements"
      },
      {
        title: "Recursive Error Handling",
        difficulty: "Hard",
        description: "Add robust error checking to recursive functions"
      }
    ],
    topics: ["Python", "Recursion", "Binary Search", "IndexError", "Algorithm Debugging"],
    relatedConcepts: [
      "Divide and conquer",
      "Time complexity",
      "Space complexity",
      "Recursive stack",
      "Array bounds"
    ],
    status: "In Progress",
    timeElapsed: "25 minutes",
    previousSessions: [
      {
        date: "2024-02-10",
        topic: "Linked List Implementation",
        duration: "45 minutes"
      }
    ]
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'context', label: 'Context', icon: FileText },
    { id: 'error', label: 'Error', icon: AlertTriangle },
    { id: 'solution', label: 'Solution', icon: BrainCircuit },
    { id: 'practice', label: 'Practice', icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
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
                <CardTitle>Student Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{sessionData.question}</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'context':
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Prior Knowledge</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {sessionData.context.priorKnowledge.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {sessionData.context.recentTopics.map((topic, index) => (
                    <li key={index} className="text-gray-700">{topic}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Previous Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessionData.previousSessions.map((session, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-0 py-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{session.topic}</span>
                      <span className="text-gray-500">{session.date}</span>
                    </div>
                    <span className="text-sm text-gray-500">{session.duration}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      case 'error':
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="bg-red-50 text-red-800 border-red-200">
                    <AlertDescription>
                      <div className="font-mono">{sessionData.errorDetails.errorMessage}</div>
                      <div className="text-sm mt-1">Line {sessionData.errorDetails.lineNumber}</div>
                    </AlertDescription>
                  </Alert>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    {sessionData.errorDetails.codeSnippet}
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
                    <li key={index} className="text-gray-700">{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        );
      case 'solution':
        return (
          <div className="space-y-6">
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
        );
      case 'practice':
        return (
          <div className="space-y-6">
            {sessionData.practiceExercises.map((exercise, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{exercise.title}</CardTitle>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                      ${exercise.difficulty === 'Hard' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{exercise.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      default:
        return (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent>
              <p className="text-gray-700">Select a section from the sidebar to view content.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen  bg-gray-50 pt-20 relative">
      {/* Rest of the component structure remains the same */}
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
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              End Session
            </button>
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
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          activeSection === item.id
                            ? 'bg-blue-100 text-blue-600 font-semibold'
                            : 'text-gray-600 hover:bg-blue-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <h3 className="font-medium text-sm text-gray-500 px-3 mb-2">Quick Actions</h3>
                  <div className="space-y-1">
                    <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 transition-all duration-200">
                      <MessageSquare className="h-4 w-4" />
                      <span>Send Message</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 transition-all duration-200">
                      <Code className="h-4 w-4" />
                      <span>Share Code Snippet</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}