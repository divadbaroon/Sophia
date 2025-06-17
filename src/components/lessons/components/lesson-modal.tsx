"use client"

import { X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LessonModalProps {
  isOpen: boolean
  onClose: () => void
  concept: {
    title: string
    content: string
    examples: string[]
    keyPoints: string[]
  } | null
  onComplete?: () => void
}

export function LessonModal({ isOpen, onClose, concept, onComplete }: LessonModalProps) {
  if (!concept) return null

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border-2 border-black">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-black">{concept.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="prose prose-gray max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{concept.content}</div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Key Points</h4>
            <ul className="space-y-2">
              {concept.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">Examples</h4>
            <div className="space-y-3">
              {concept.examples.map((example, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">{example}</pre>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={handleComplete} className="bg-black text-white hover:bg-gray-800 transition-colors">
              {onComplete ? "Take Quiz" : "Continue Learning"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
