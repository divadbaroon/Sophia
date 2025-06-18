"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Info, ChevronDown, ChevronUp, Sparkles, Shield, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface ConsentModalProps {
  isOpen?: boolean
  onClose?: () => void
  onConsent: (hasConsented: boolean) => Promise<void>
  isProcessing?: boolean
}

const ConsentModal = ({ isOpen = true, onClose, onConsent, isProcessing = false }: ConsentModalProps) => {
  const [isChecked, setIsChecked] = useState(false)
  const [isExampleOpen, setIsExampleOpen] = useState(false)

  const handleAccept = async () => {
    if (isProcessing) return
    await onConsent(isChecked)
  }

  const originalVoiceUrl =
    "https://colpzxhrkmkatbmnobft.supabase.co/storage/v1/object/public/audio-recordings/recordings/e958fa27-7074-4f34-b671-043d3070f455/user_2pAZGyT6WkYjbrDc0iY5uiHlEZq_2024-11-21T17:55:47.924Z.webm"
  const anonymizedVoiceUrl =
    "https://colpzxhrkmkatbmnobft.supabase.co/storage/v1/object/public/audio-recordings/recordings/e958fa27-7074-4f34-b671-043d3070f455/user_2pAZGyT6WkYjbrDc0iY5uiHlEZq_2024-11-21T17:55:49.031Z.webm"

  const content = (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 shadow-lg border-t-4 border-t-primary">
      <DialogTitle className="sr-only">Welcome to Sophia - Consent and Information</DialogTitle>
      <div className="w-full">
        <div className="text-center space-y-2 pb-2 p-6">
          <h1 className="text-4xl font-bold text-primary">Welcome to Sophia</h1>
          <p className="text-muted-foreground">
            Please review the information below and provide your consent to participate.
          </p>
        </div>

        <div className="space-y-8 px-6">
          <section className="prose dark:prose-invert max-w-none">
            <div className="bg-primary/5 p-6 rounded-lg my-6 border border-primary/10 shadow-sm">
              <h3 className="text-2xl font-semibold mb-3 text-primary flex items-center">
                <Sparkles className="mr-2 h-6 w-6" />
                What is Sophia?
              </h3>
              <p className="text-lg leading-relaxed">
                Sophia identifies your unique understanding patterns and misconceptions—not just random errors—and
                provides gentle, targeted explanations accordingly. The platform visualizes your mental model and adapts
                help specifically for you, ensuring you receive empathetic support exactly at your conceptual level.
              </p>
            </div>

            <div className="bg-primary/5 p-6 rounded-lg my-6 border border-primary/10 shadow-sm">
              <h3 className="text-2xl font-semibold mb-3 text-primary flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                Data Collection & Privacy
              </h3>
              <p className="text-lg leading-relaxed mb-4">
                All student interactions, quiz responses, coding sessions, and any audio data are anonymized and
                securely stored. No retrieved data can be traced back to any individual student. Your privacy is our top
                priority.
              </p>

              <div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsExampleOpen(!isExampleOpen)}
                    className="flex items-center text-primary hover:underline focus:outline-none"
                  >
                    {isExampleOpen ? <ChevronUp className="h-5 w-5 mr-1" /> : <ChevronDown className="h-5 w-5 mr-1" />}
                    See Privacy Example
                  </button>
                </div>

                {isExampleOpen && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-2">Original Voice</h4>
                        <audio controls className="w-full">
                          <source src={originalVoiceUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-2">Anonymized Voice</h4>
                        <audio controls className="w-full">
                          <source src={anonymizedVoiceUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-lg my-6 border border-primary/10 shadow-sm">
              <h3 className="text-2xl font-semibold mb-3 text-primary flex items-center">
                <Info className="mr-2 h-6 w-6" />
                Voluntary Participation
              </h3>
              <p className="text-lg leading-relaxed mt-2">
                Choosing not to participate will have no negative impact on your grades, academic standing, or any other
                aspect of your education. You can withdraw from the platform at any time without consequences.
              </p>
            </div>

            <div className="bg-primary/5 p-6 rounded-lg my-6 border border-primary/10 shadow-sm">
              <h3 className="text-2xl font-semibold mb-3 text-primary flex items-center">
                <Mail className="mr-2 h-6 w-6" />
                Contact Information
              </h3>
              <p className="text-lg leading-relaxed">
                For questions or concerns about Sophia, technical support, or privacy matters, please contact your
                instructor or the Sophia support team at{" "}
                <a href="mailto:dbarron410@vt.edu" className="text-primary underline">
                  dbarron410@vt.edu
                </a>
                .
              </p>
            </div>
          </section>

          <div className="flex items-center space-x-3 p-6 bg-secondary/20 rounded-lg border border-secondary">
            <Checkbox
              id="consent"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
              className="h-5 w-5"
            />
            <label
              htmlFor="consent"
              className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand how Sophia works and agree to participate in this personalized learning experience. I
              acknowledge that my interactions will be monitored for educational research purposes and that I can
              withdraw at any time.
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 pb-8 px-6 border-t">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-base">
            Decline & Return Home
          </Button>
          <Button
            variant="default"
            disabled={!isChecked || isProcessing}
            onClick={handleAccept}
            className="w-full sm:w-auto text-base"
          >
            {isProcessing ? (
              <>
                <AlertCircle className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "I Consent"
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  )

  return onClose ? (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {content}
    </Dialog>
  ) : (
    content
  )
}

export default ConsentModal
