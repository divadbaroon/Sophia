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
  conversationHistory,
  showInitialGreeting,
  getLatestAssistantMessage,
  voiceState,
  currentStreamingMessage
}) => {
  const lastMessage = getLatestAssistantMessage();
  const [previousMessage, setPreviousMessage] = useState<string | null>(null);
  
  // Track when a new message starts
  useEffect(() => {
    if (status === ConversationStatus.SPEAKING && lastMessage !== previousMessage) {
      setPreviousMessage(lastMessage);
    }
  }, [status, lastMessage, previousMessage]);

  return (
    <div 
      className="rounded-md border p-4 relative bg-gray-50"
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
      
      {/* Only show Voice Circle when not speaking, not showing a message, and not recognizing speech */}
      {status !== ConversationStatus.SPEAKING && 
        !(status === ConversationStatus.IDLE && getLatestAssistantMessage()) && 
        !(status === ConversationStatus.IDLE && isUserSpeaking) && (
        <div className={`flex justify-center items-center mb-6 ${status === ConversationStatus.PROCESSING ? 'mt-6' : ''}`}>
          <div className={`${status === ConversationStatus.PROCESSING ? 'h-28 w-28' : 'h-24 w-24'}`}>
            <VoiceCircle state={voiceState} />
          </div>
        </div>
      )}
      
      {/* Content display based on state */}
      {status === ConversationStatus.IDLE && isUserSpeaking ? (
        <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: '180px' }}>
          <div className="text-center py-3 px-4 bg-gray-100 rounded-2xl text-gray-700 shadow-sm">
            <strong className="text-gray-800">Recognizing:</strong> {transcript}
          </div>
        </div>
      ) : status === ConversationStatus.IDLE && !isUserSpeaking ? (
        getLatestAssistantMessage() ? (
          // Show the last assistant message if available - without circle
          <div className="flex flex-col items-start">
            <div className="py-4 px-5 bg-white rounded-2xl text-gray-700 shadow-sm w-full font-medium"
              style={{ 
                minHeight: '180px',
                height: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
              {lastMessage}
            </div>
          </div>
        ) : showInitialGreeting ? (
          // Show initial greeting if no previous message
          <div className="flex flex-col items-center justify-center mt-6">
            <p className="text-muted-foreground text-center">
              I'm listening. How can I help?
            </p>
          </div>
        ) : (
          // Only show "Listening..." if there's no previous message and no greeting
          <div className="flex flex-col items-center justify-center mt-6">
            <p className="text-muted-foreground text-center">
              Listening...
            </p>
          </div>
        )
      ) : status === ConversationStatus.SPEAKING ? (
        // Simply show the text while speaking - removed the blue border
        <div className="flex flex-col items-start">
          <div className="py-4 px-5 bg-white rounded-2xl text-gray-700 shadow-sm w-full font-medium"
            style={{ 
              minHeight: '180px',
              height: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
            {/* Show the current message text directly, no streaming, no border */}
            {currentStreamingMessage?.text || lastMessage}
          </div>
        </div>
      ) : status === ConversationStatus.PROCESSING ? (
        <div className="flex flex-col items-center justify-center mt-8">
 
        </div>
      ) : null}
    </div>
  );
};

export default RecognitionDisplay;