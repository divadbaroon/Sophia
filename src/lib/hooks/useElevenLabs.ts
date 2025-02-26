import { useState, useCallback, useRef } from 'react';
import { textToSpeech } from '@/lib/services/ElevenLabsService';
import { ClaudeMessage } from '@/types';

interface UseElevenLabsReturn {
  isLoading: boolean;
  error: string | null;
  audioUrl: string | null;
  speakMessage: (message: string) => Promise<void>;
  speakLastResponse: (messages: ClaudeMessage[]) => Promise<void>;
  stopSpeaking: () => void;
  isPlaying: boolean;
  clearError: () => void;
}

export const useElevenLabs = (): UseElevenLabsReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopSpeaking = useCallback(() => {
    console.log('TTS: Stopping audio playback');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const speakMessage = useCallback(async (text: string) => {
    console.log('TTS: Attempting to speak text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Stop any currently playing audio
    stopSpeaking();
    
    if (!text.trim()) {
      console.log('TTS: Empty text provided');
      setError("No text provided for text-to-speech");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('TTS: Calling textToSpeech service');
      const result = await textToSpeech(text);
      console.log('TTS: Received result from service:', result);
      
      if (!result.audioUrl) {
        throw new Error('TTS: No audio URL returned from service');
      }
      
      setAudioUrl(result.audioUrl);
      
      // Create and play audio element
      console.log('TTS: Creating audio element with URL:', result.audioUrl);
      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      
      // Set up detailed event handlers for audio element
      audio.onloadstart = () => console.log('TTS: Audio loading started');
      audio.onloadeddata = () => console.log('TTS: Audio data loaded');
      audio.oncanplay = () => console.log('TTS: Audio can play now');
      
      audio.onplay = () => {
        console.log('TTS: Audio playback started');
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        console.log('TTS: Audio playback ended');
        setIsPlaying(false);
      };
      
      audio.onerror = (e) => {
        console.error('TTS: Error playing audio:', e);
        console.error('TTS: Audio error code:', audio.error?.code);
        console.error('TTS: Audio error message:', audio.error?.message);
        setError(`Error playing audio: ${audio.error?.message || 'Unknown error'}`);
        setIsPlaying(false);
      };
      
      audio.onpause = () => {
        console.log('TTS: Audio paused');
      };
      
      // Try to play the audio
      console.log('TTS: Attempting to play audio');
      try {
        // Using the Promise returned by play()
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('TTS: Audio play() method succeeded');
            })
            .catch(playError => {
              console.error('TTS: Error in audio.play() promise:', playError);
              setError(`Failed to play audio: ${playError.message || 'Unknown error'}`);
              setIsPlaying(false);
            });
        } else {
          console.log('TTS: Audio play() did not return a promise');
        }
      } catch (playError) {
        console.error('TTS: Error in audio.play() method:', playError);
        throw playError;
      }
    } catch (err) {
      console.error("TTS: Error in text-to-speech process:", err);
      setError(err instanceof Error ? err.message : "Failed to convert text to speech");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [stopSpeaking]);

  const speakLastResponse = useCallback(async (messages: ClaudeMessage[]) => {
    console.log('TTS: Speaking last response from conversation history');
    console.log('TTS: Messages to search:', messages.length);
    
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    console.log('TTS: Found assistant messages:', assistantMessages.length);
    
    if (assistantMessages.length === 0) {
      console.log('TTS: No assistant messages found');
      setError("No assistant messages found to speak");
      return;
    }
    
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    console.log('TTS: Speaking last message with length:', lastMessage.content.length);
    await speakMessage(lastMessage.content);
  }, [speakMessage]);

  return {
    isLoading,
    error,
    audioUrl,
    speakMessage,
    speakLastResponse,
    stopSpeaking,
    isPlaying,
    clearError
  };
};