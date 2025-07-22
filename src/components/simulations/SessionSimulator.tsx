"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Session {
  id: string
  studentName: string
  studentAvatar: string
  status: "active" | "completed" | "paused"
  duration: string
  messages: number
  subject: string
  difficulty: "beginner" | "intermediate" | "advanced"
  score: number
  startTime: string
}

interface Message {
  id: string
  speaker: "tutor" | "student"
  text: string
  timestamp: string
}

interface SessionSimulatorProps {
  session: Session
}

export default function SessionSimulator({ session }: SessionSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<"tutor" | "student" | null>(null)

  const getDifficultyColor = (difficulty: Session["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const mockConversation: Omit<Message, "id">[] = [
    { speaker: "tutor", text: "Hello! Ready to explore binary trees today?", timestamp: "2:30 PM" },
    { speaker: "student", text: "Yes, but I'm a bit confused about tree traversal.", timestamp: "2:30 PM" },
    { speaker: "tutor", text: "No problem! Let's start with the basics. Can you tell me what you know about trees?", timestamp: "2:31 PM" },
    { speaker: "student", text: "I know trees have nodes and each node can have children.", timestamp: "2:31 PM" },
    { speaker: "tutor", text: "Exactly! Now, when we traverse a tree, we visit each node in a specific order. There are three main ways...", timestamp: "2:32 PM" },
    { speaker: "student", text: "Is one of them called 'inorder'?", timestamp: "2:32 PM" },
    { speaker: "tutor", text: "Perfect! Yes, inorder traversal visits left subtree, root, then right subtree.", timestamp: "2:33 PM" },
    { speaker: "student", text: "So for a binary search tree, inorder gives us sorted values?", timestamp: "2:33 PM" },
    { speaker: "tutor", text: "Brilliant insight! That's exactly right. You're getting it!", timestamp: "2:34 PM" },
  ]

  const startSimulation = () => {
    setIsPlaying(true)
    setMessages([])
    
    mockConversation.forEach((msg, index) => {
      setTimeout(() => {
        setCurrentSpeaker(msg.speaker)
        
        setTimeout(() => {
          setMessages(prev => [...prev, { ...msg, id: `msg-${index}` }])
          setCurrentSpeaker(null)
          
          if (index === mockConversation.length - 1) {
            setIsPlaying(false)
          }
        }, 1500)
        
      }, index * 3000)
    })
  }

  const stopSimulation = () => {
    setIsPlaying(false)
    setCurrentSpeaker(null)
    setMessages([])
  }

  return (
    <div className="space-y-6">
      {/* Session Info Header */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{session.subject}</h3>
            <p className="text-sm text-gray-600">Duration: {session.duration} • {session.messages} messages</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getDifficultyColor(session.difficulty)}>
              {session.difficulty}
            </Badge>
            <span className="text-sm font-medium">Score: {session.score}%</span>
          </div>
        </div>
      </div>

      {/* Avatars Section */}
      <div className="flex items-center justify-between px-8">
        {/* Student Avatar */}
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
            currentSpeaker === 'student' 
              ? 'bg-green-100 border-green-500 text-green-700 shadow-lg scale-110' 
              : 'bg-gray-100 border-gray-300 text-gray-600'
          }`}>
            👨‍🎓
          </div>
          <p className="text-sm font-medium mt-2 text-center">Student</p>
          {currentSpeaker === 'student' && (
            <div className="flex gap-1 mt-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>

        {/* VS Indicator */}
        <div className="text-gray-400 text-sm font-medium">
          {isPlaying ? "Live Session" : "Ready to Start"}
        </div>

        {/* Tutor Agent Avatar */}
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
            currentSpeaker === 'tutor' 
              ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-lg scale-110' 
              : 'bg-gray-100 border-gray-300 text-gray-600'
          }`}>
            🤖
          </div>
          <p className="text-sm font-medium mt-2 text-center">AI Tutor</p>
          {currentSpeaker === 'tutor' && (
            <div className="flex gap-1 mt-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button 
          onClick={startSimulation} 
          disabled={isPlaying}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPlaying ? 'Playing...' : 'Start Simulation'}
        </Button>
        <Button 
          variant="outline" 
          onClick={stopSimulation}
        >
          Stop
        </Button>
      </div>

      {/* Conversation History */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h4 className="font-medium">Conversation History</h4>
        </div>
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              Click "Start Simulation" to watch the tutoring session unfold...
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 animate-fade-in ${
                  message.speaker === 'student' ? '' : 'flex-row-reverse'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  message.speaker === 'student' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {message.speaker === 'student' ? '👨‍🎓' : '🤖'}
                </div>
                <div className={`max-w-md p-3 rounded-lg ${
                  message.speaker === 'student'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="font-medium text-xs mb-1 text-gray-600">
                    {message.speaker === 'tutor' ? 'AI Tutor' : 'Student'} • {message.timestamp}
                  </div>
                  <div className="text-sm text-gray-900">{message.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}