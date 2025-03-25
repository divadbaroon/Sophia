import React, { useState, useEffect } from 'react'
import VoiceCircle from './VoiceCircle'
import { RecognitionDisplayProps } from '@/types'
import { ConversationStatus } from '@/lib/services/ConversationManager'

/**
 * RecognitionDisplay - Displays the live recognition state
 * Shows the voice circle animation and recognition text
 */
const RecognitionDisplay: React.FC<RecognitionDisplayProps> = ({
  transcript,
  status,
  isUserSpeaking,
  bargeInDetected,
  showInitialGreeting,
  getLatestAssistantMessage,
  voiceState
}) => {
  // State to track whether we're in the transition period before speech begins
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);
  
  // Detect changes in status to handle the transition delay
  useEffect(() => {
    // When status changes to SPEAKING
    if (status === ConversationStatus.SPEAKING) {
      // Set transition state to true
      setIsTransitioning(true);
      
      // After a delay, set transition to false to show the message
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setDisplayedMessage(getLatestAssistantMessage());
      }, 2000); // 1.5 second delay
      
      return () => clearTimeout(timer);
    } else if (status !== ConversationStatus.SPEAKING) {
      // Reset transition state when not speaking
      setIsTransitioning(false);
      setDisplayedMessage(null);
    }
  }, [status, getLatestAssistantMessage]);
  
  return (
    <div 
      className="rounded-md border p-4 relative"
      style={{ 
        height: 'auto',
        minHeight: '200px',
        overflow: 'auto',
        transition: 'height 0.3s ease-in-out'
      }}
    >
      {bargeInDetected && (
        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full animate-pulse">
          Barge-in detected
        </div>
      )}
      
      {/* Voice Circle Animation Container - Show when not speaking or during transition */}
      {(status === ConversationStatus.PROCESSING || isTransitioning) && (
        <div className={`flex justify-center items-center mb-6 mt-6`}>
          <div className="h-28 w-28">
            <VoiceCircle state={isTransitioning ? "processing" : voiceState} />
          </div>
        </div>
      )}
      
      {/* Content display based on state */}
      {status === ConversationStatus.IDLE && isUserSpeaking ? (
        <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-lg text-center">
          Recognizing: {transcript}
        </div>
      </div>
      ) : status === ConversationStatus.IDLE && !isUserSpeaking ? (
        getLatestAssistantMessage() ? (
          // Show the last assistant message if available
          <div className="flex flex-col items-start p-2">
            <div className="prose prose-sm w-full">
              <p>{getLatestAssistantMessage()}</p>
            </div>
          </div>
        ) : showInitialGreeting ? (
          // Show initial greeting if no previous message
          <div className="flex flex-col items-center justify-center">
            <div className="text-lg text-muted-foreground">
              Listening...
            </div>
          </div>
        ) : (
          // Only show "Listening..." if there's no previous message and no greeting
          <div className="flex flex-col items-center justify-center">
            <div className="text-lg text-muted-foreground">
              Listening...
            </div>
          </div>
        )
      ) : status === ConversationStatus.SPEAKING && !isTransitioning ? (
        <div className="flex flex-col items-start p-2">
          <div className="prose prose-sm w-full">
            <p style={{ whiteSpace: 'pre-wrap' }}>{displayedMessage}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default RecognitionDisplay