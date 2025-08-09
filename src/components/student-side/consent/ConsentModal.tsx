"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Info, ChevronDown, ChevronUp, Sparkles, Shield, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

import { ConsentModalProps } from "./types"

const ConsentModal = ({ isOpen = true, onClose, onConsent, isProcessing = false }: ConsentModalProps) => {
  const [isChecked, setIsChecked] = useState(false)
  const [isExampleOpen, setIsExampleOpen] = useState(false)

  const handleAccept = async () => {
    if (isProcessing) return
    await onConsent(isChecked)
  }

  const originalVoiceUrl =
    "https://tlvlwydkkdxsgdqxzahc.supabase.co/storage/v1/object/public/consent-form-recordings/NonAnonymizedVoice.webm"
  const anonymizedVoiceUrl =
    "https://tlvlwydkkdxsgdqxzahc.supabase.co/storage/v1/object/public/consent-form-recordings/AnonymizedVoice.webm"

  const content = (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0 shadow-lg border-t-4 border-t-primary">
      <DialogTitle className="sr-only">Welcome to Sophia - Consent and Information</DialogTitle>
      <div className="w-full">
        <div className="text-center space-y-1 pb-4 p-4">
          <h1 className="text-2xl font-bold text-primary">Welcome to Sophia</h1>
          <p className="text-sm text-muted-foreground">
            Please review and provide your consent to participate.
          </p>
        </div>

        <div className="space-y-4 px-4">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h3 className="text-lg font-semibold mb-2 text-primary flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              What is Sophia?
            </h3>
            <p className="text-sm leading-relaxed">
              Sophia is a context-aware voice agent that personalizes interactions based on individual students' mental models. 
              Sophia is designed and configured by instructors and tested at scale using simulated students to ensure appropriate pedagogical behavior and responses.
            </p>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h3 className="text-lg font-semibold mb-2 text-primary flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Privacy & Data
            </h3>
            <p className="text-sm leading-relaxed mb-3">
              All interactions are anonymized and securely stored. No data can be traced back to you.
            </p>

            <div>
              <button
                onClick={() => setIsExampleOpen(!isExampleOpen)}
                className="flex items-center text-primary hover:underline focus:outline-none text-sm"
              >
                {isExampleOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                See Privacy Example
              </button>

              {isExampleOpen && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h4 className="text-sm font-semibold mb-2">Original Voice</h4>
                    <audio controls className="w-full h-8">
                      <source src={originalVoiceUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h4 className="text-sm font-semibold mb-2">Anonymized Voice</h4>
                    <audio controls className="w-full h-8">
                      <source src={anonymizedVoiceUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h3 className="text-lg font-semibold mb-2 text-primary flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Voluntary Participation
            </h3>
            <p className="text-sm leading-relaxed">
              Participation is completely voluntary. Declining has no impact on your grades. 
              You can withdraw at any time without consequences.
            </p>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h3 className="text-lg font-semibold mb-2 text-primary flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Questions?
            </h3>
            <p className="text-sm leading-relaxed">
              Contact your instructor or support at{" "}
              <a href="mailto:dbarron410@vt.edu" className="text-primary underline">
                dbarron410@vt.edu
              </a>
            </p>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-secondary/20 rounded-lg border border-secondary">
            <Checkbox
              id="consent"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
              className="h-4 w-4 mt-0.5"
            />
            <label
              htmlFor="consent"
              className="text-sm font-medium leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand how Sophia works and agree to participate. I acknowledge that my interactions 
              will be used for educational research and that I can withdraw at any time.
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-4 px-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Decline
          </Button>
          <Button
            variant="default"
            disabled={!isChecked || isProcessing}
            onClick={handleAccept}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
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