"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Code, HelpCircle, Target, ArrowRight } from "lucide-react"

interface InstructionsModalProps {
  isOpen: boolean
  onClose: () => void
  conceptTitle: string
  onContinue: () => void
}

export function InstructionsModal({ isOpen, onClose, conceptTitle, onContinue }: InstructionsModalProps) {
  const handleContinue = () => {
    onContinue()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-2 border-black">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-black">Ready for {conceptTitle} Practice?</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          
          {/* What to Expect */}
          <div className="space-y-4 -mt-5">
            <h4 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">What&apos;s Next:</h4>

            <div className="grid gap-4">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-black mb-1">3 {conceptTitle} Coding Tasks</h5>
                      <p className="text-sm text-gray-600">
                        You&apos;ll receive progressively challenging coding problems related to {conceptTitle.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-black mb-1">Instructor-Configured Assistance</h5>
                      <p className="text-sm text-gray-600">
                        Sophia is configured by your instructor to provide reliable guidance whenever you need it.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Code className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-black mb-1">Exam Preparation Focus</h5>
                      <p className="text-sm text-gray-600">
                        Each task builds on what you&apos;ve learned and prepares you for your exam.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleContinue}
              className="w-full bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Start Coding Tasks
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}