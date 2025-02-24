import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { createClient } from '@deepgram/sdk';
import { LiveTranscriptionEvents } from '@deepgram/sdk';
import { MessageWithHighlight, DeepgramContextType } from "@/types"

const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

export const useDeepgram = () => {
  const context = useContext(DeepgramContext);
  if (!context) {
    throw new Error('useDeepgram must be used within a DeepgramProvider');
  }
  return context;
};

export const DeepgramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState<MessageWithHighlight[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const dgConnectionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    console.log('Clearing error state');
    setError(null);
  }, []);

  const finalizeTranscript = useCallback(() => {
    console.log('Finalizing transcript after 3 seconds of silence');
    console.log('Current accumulated transcript:', accumulatedTranscriptRef.current);
    
    const finalTranscript = accumulatedTranscriptRef.current.trim();
    if (finalTranscript) {
      console.log('Finalizing and adding to history:', finalTranscript);
      
      // Update conversation history with correct type
      setConversationHistory(prev => {
        console.log('Previous history:', prev);
        const newHistory: MessageWithHighlight[] = [...prev, {
          role: 'user' as const,
          content: finalTranscript
        }];
        console.log('New history:', newHistory);
        return newHistory;
      });
      
      // Clear current transcripts
      setDisplayTranscript("");
      accumulatedTranscriptRef.current = "";
      setIsSpeaking(false);
    } else {
      console.log('No transcript to finalize');
    }
  }, []);

  const resetSilenceTimeout = useCallback(() => {
    console.log('Resetting silence timeout');
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      console.log('Silence timeout triggered (2s elapsed)');
      finalizeTranscript();
    }, 2000);
  }, [finalizeTranscript]);

  const startRecording = async () => {
    console.log('Starting recording session');
    if (!DEEPGRAM_API_KEY) {
      console.error('No Deepgram API key found');
      setError("Deepgram API key is not configured");
      return;
    }

    try {
      setError(null);
      setIsRecording(true);
      setDisplayTranscript("");
      accumulatedTranscriptRef.current = "";
      setIsSpeaking(false);

      console.log('Requesting microphone access');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          noiseSuppression: true, 
          echoCancellation: true 
        }
      });

      const deepgram = createClient(DEEPGRAM_API_KEY);
      console.log('Creating Deepgram connection');
      const dgConnection = await deepgram.listen.live({
        model: 'nova-3',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        punctuate: true
      });

      dgConnectionRef.current = dgConnection;

      dgConnection.addListener(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && dgConnection.getReadyState() === 1) {
            dgConnection.send(event.data);
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
      });

      dgConnection.addListener(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcriptText = data.channel.alternatives[0].transcript.trim();
        
        if (transcriptText) {
          console.log('Received transcript:', {
            text: transcriptText,
            is_final: data.is_final,
            is_speaking: true
          });
          
          setIsSpeaking(true);
          
          // Accumulate transcript
          if (data.is_final) {
            console.log('Adding to accumulated transcript:', transcriptText);
            // Add space between segments if needed
            if (accumulatedTranscriptRef.current && !accumulatedTranscriptRef.current.endsWith(" ")) {
              accumulatedTranscriptRef.current += " ";
            }
            accumulatedTranscriptRef.current += transcriptText;
            console.log('Current accumulated:', accumulatedTranscriptRef.current);
          }
          
          // Reset silence timer
          resetSilenceTimeout();
        } else {
          if (!data.is_final) {
            setDisplayTranscript("");
          }
        }
      });

      dgConnection.addListener(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram error:', error);
        setError('Error during transcription. Please try again.');
        stopRecording();
      });

      dgConnection.addListener(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        if (accumulatedTranscriptRef.current.trim()) {
          finalizeTranscript();
        }
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check your microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = useCallback(() => {
    console.log('Stopping recording');
    setIsRecording(false);
    setIsSpeaking(false);
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (dgConnectionRef.current) {
      dgConnectionRef.current.finish();
    }

    // Handle any remaining transcript
    if (accumulatedTranscriptRef.current.trim()) {
      finalizeTranscript();
    }

    setDisplayTranscript("");
    accumulatedTranscriptRef.current = "";
  }, [finalizeTranscript]);

  const value = {
    isStarted,
    setIsStarted,
    transcript: displayTranscript,
    conversationHistory,
    isRecording,
    isSpeaking,
    error,
    startRecording,
    stopRecording,
    clearError
  };

  return (
    <DeepgramContext.Provider value={value}>
      {children}
    </DeepgramContext.Provider>
  );
};