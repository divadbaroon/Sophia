import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConversationManagerContext } from '@/lib/context/ConversationManagerContext'
import { useFile } from '@/lib/context/FileContext'
import { ConversationStatus } from '@/lib/services/ConversationManager'

import VoiceCircle from './VoiceCircle'
import RecognitionDisplay from './RecognitionDisplay'
import TranscriptHistory from './TranscriptHistory'
import RecognitionSettings from './RecognitionSettings'
import { QuestionPanelProps, TranscriptData, SpeakToOption, ScenarioOption, VoiceCircleState } from '@/types'

/**
 * Maps conversation status to voice circle state
 */
const mapStatusToVoiceState = (
  status: ConversationStatus | undefined, 
  isUserSpeaking: boolean
): VoiceCircleState => {
  if (status === undefined) {
    return "idle";
  }
  
  switch (status) {
    case ConversationStatus.IDLE:
      return isUserSpeaking ? "listening" : "idle";
    case ConversationStatus.PROCESSING:
      return "processing";
    case ConversationStatus.SPEAKING:
      return "speaking";
    default:
      return "idle";
  }
};

/**
 * QuestionPanel - Main component for speech recognition and conversation
 */
const QuestionPanel: React.FC<QuestionPanelProps> = ({ 
  onClearHighlight
}) => {
  const {
    transcript,
    error,
    status,
    startRecording,
    conversationHistory,
    onTranscriptFinalized,
    currentStreamingMessage 
  } = useConversationManagerContext()

  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false)
  const [showInitialGreeting, setShowInitialGreeting] = useState<boolean>(true)
  const [bargeInDetected, setBargeInDetected] = useState<boolean>(false)

  // Effect to monitor transcript changes and detect barge-ins
  useEffect(() => {
    if (transcript && transcript.trim() !== '') {
      setIsUserSpeaking(true)
      
      if (status === ConversationStatus.SPEAKING) {
        console.log('Barge-in detected in UI: User spoke while system was speaking')
        setBargeInDetected(true)
        
        setTimeout(() => {
          setBargeInDetected(false)
        }, 3000)
      }
    } else {
      setIsUserSpeaking(false)
    }
  }, [transcript, status])
  
  // Get current file context
  const { 
    speakTo: fileSpeakTo, 
    scenario: fileScenario, 
    updateSpeakTo, 
    updateScenario 
  } = useFile() as {
    speakTo: SpeakToOption,
    scenario: ScenarioOption,
    updateSpeakTo: (value: SpeakToOption) => void,
    updateScenario: (value: ScenarioOption) => void
  }

  const contentRef = useRef<HTMLDivElement>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

  // Listen for transcripts being finalized
  useEffect(() => {
    if (typeof onTranscriptFinalized === 'function') {
      const unsubscribe = onTranscriptFinalized(({ text, timestamp }: TranscriptData) => {
        console.log(`Transcript finalized at ${new Date(timestamp).toISOString()}:`, text)
      })
      
      return unsubscribe
    }
  }, [onTranscriptFinalized])
  
  // Get the latest assistant message
  const getLatestAssistantMessage = useCallback((): string | null => {
    if (!conversationHistory || conversationHistory.length === 0) return null
    
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      if (conversationHistory[i].role === 'assistant') {
        return conversationHistory[i].content
      }
    }
    return null
  }, [conversationHistory]);

  // Start recording automatically when component mounts
  useEffect(() => {
    if (status === ConversationStatus.IDLE) {
      startRecording()
    }
  }, [startRecording, status])

  // Hide initial greeting once we have a real message
  useEffect(() => {
    if (conversationHistory && conversationHistory.length > 0) {
      setShowInitialGreeting(false)
    }
  }, [conversationHistory])

  // Save settings
  const handleSaveSettings = (speakTo: SpeakToOption, scenario: ScenarioOption) => {
    updateSpeakTo(speakTo)
    updateScenario(scenario)
    setIsSettingsOpen(false)
  }

  // Determine the current voice state
  const voiceState = mapStatusToVoiceState(status, isUserSpeaking)

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => {
          startRecording()
          if (onClearHighlight) onClearHighlight()
        }}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">Current</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <div ref={contentRef}>
            {!isUserSpeaking && showInitialGreeting ? (
              <div className="rounded-md border p-4 relative">
                <div className="flex flex-col items-center">
                  <div className="h-28 w-28 mx-auto mb-4">
                    <VoiceCircle state="idle" />
                  </div>
                  <p className="text-muted-foreground mb-2 text-center">
                    Explain the problem you&apos;re running into
                  </p>
                </div>
              </div>
            ) : (
              <RecognitionDisplay
                transcript={transcript}
                status={status}
                isUserSpeaking={isUserSpeaking}
                bargeInDetected={bargeInDetected}
                conversationHistory={conversationHistory}
                showInitialGreeting={showInitialGreeting}
                getLatestAssistantMessage={getLatestAssistantMessage}
                voiceState={voiceState}
                currentStreamingMessage={currentStreamingMessage}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <TranscriptHistory conversationHistory={conversationHistory} />
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <RecognitionSettings
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        speakTo={fileSpeakTo}
        scenario={fileScenario}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default QuestionPanel