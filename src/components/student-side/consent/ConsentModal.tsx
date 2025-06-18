import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Info, ChevronDown, ChevronUp, Code, Shield, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ConsentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConsent: (hasConsented: boolean) => Promise<void>;
  isProcessing?: boolean;
}

const ConsentModal = ({ 
  isOpen = true, 
  onClose, 
  onConsent,
  isProcessing = false 
}: ConsentModalProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  const handleAccept = async () => {
    if (isProcessing) return;
    await onConsent(isChecked);
  };

  const handleDecline = () => {
    // Simply close the modal without redirecting
    if (onClose) {
      onClose();
    }
  };

  const originalVoiceUrl = 'https://colpzxhrkmkatbmnobft.supabase.co/storage/v1/object/public/audio-recordings/recordings/e958fa27-7074-4f34-b671-043d3070f455/user_2pAZGyT6WkYjbrDc0iY5uiHlEZq_2024-11-21T17:55:47.924Z.webm';
  const anonymizedVoiceUrl = 'https://colpzxhrkmkatbmnobft.supabase.co/storage/v1/object/public/audio-recordings/recordings/e958fa27-7074-4f34-b671-043d3070f455/user_2pAZGyT6WkYjbrDc0iY5uiHlEZq_2024-11-21T17:55:49.031Z.webm';

  const content = (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
          <Code className="h-6 w-6" />
          Welcome to Sophia
        </CardTitle>
        <p className="text-center text-muted-foreground mt-2">
          Please review the information below about this interactive learning experience.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  What is this platform?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  This is an interactive Python learning environment designed to help you practice coding 
                  through hands-on exercises, real-time feedback, and collaborative problem-solving activities. 
                  The platform tracks your progress to provide personalized learning insights.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy & Data Protection
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your coding sessions, interactions, and any audio recordings are processed securely. 
                  All personal identifiers are anonymized, and your data is protected following 
                  educational privacy standards.
                </p>
                
                <div className="mt-4">
                  <button
                    onClick={() => setIsExampleOpen(!isExampleOpen)}
                    className="flex items-center text-primary hover:underline focus:outline-none"
                  >
                    {isExampleOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    See Privacy Example
                  </button>

                  {isExampleOpen && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-4">
                        Here&apos;s how we protect your voice data:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 text-sm">
                            <AlertCircle className="inline h-4 w-4 mr-1 text-amber-500" />
                            Original Voice
                          </h4>
                          <audio controls className="w-full">
                            <source src={originalVoiceUrl} type="audio/webm" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-sm">
                            <Shield className="inline h-4 w-4 mr-1 text-green-500" />
                            Anonymized Voice
                          </h4>
                          <audio controls className="w-full">
                            <source src={anonymizedVoiceUrl} type="audio/webm" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Your Learning Experience
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  This platform is designed to enhance your programming skills through interactive exercises. 
                  Your participation helps us understand how students learn to code and improve the educational experience. 
                  You can stop using the platform at any time without any academic consequences.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Info className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Need Help?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about the platform, encounter technical issues, or have privacy concerns, 
                  please contact your instructor or reach out to our support team at{' '}
                  <a href="mailto:dbarron410@vt.edu" className="text-primary hover:underline">
                    dbarron410@vt.edu
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="consent-checkbox"
            checked={isChecked}
            onCheckedChange={(checked) => setIsChecked(checked === true)}
            className="h-5 w-5"
          />
          <label htmlFor="consent-checkbox" className="text-sm leading-relaxed cursor-pointer">
            I understand how this platform works and agree to participate in this coding session. I know that my interactions will be recorded for educational research purposes and that I can stop participating at any time.
          </label>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-3">
        <Button variant="outline" onClick={handleDecline}>
          Not Now
        </Button>
        <Button onClick={handleAccept} disabled={!isChecked || isProcessing}>
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            "I consent"
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  return onClose ? (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          Welcome to Sophia - Consent and Information
        </DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  ) : content;
};

export default ConsentModal;