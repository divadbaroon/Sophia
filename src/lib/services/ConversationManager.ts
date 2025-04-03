import { createClient } from '@deepgram/sdk';
import { LiveTranscriptionEvents, LiveClient } from '@deepgram/sdk';
import { LiveTranscriptionResponse } from "@/types";
import { ConversationManagerOptions, ConversationState } from '@/types';
import { EventEmitter } from 'events';

// State listener type
export type ConversationStateListener = (state: ConversationState) => void;

// Enum for conversation flow states
export enum ConversationStatus {
  IDLE = 'idle',           
  PROCESSING = 'processing', 
  SPEAKING = 'speaking'   
}

export class ConversationManager extends EventEmitter {
  private state: ConversationState = {
    transcript: "",
    conversationHistory: [],
    currentStreamingMessage: null,
    error: null,
    autoTTS: true,
    status: ConversationStatus.IDLE
  };
  
  private mediaRecorder: MediaRecorder | null = null;
  private deepgramConnection: LiveClient | null = null;
  private accumulatedTranscript: string = "";
  private silenceTimeout: NodeJS.Timeout | null = null;
  private stateListeners: ConversationStateListener[] = [];
  private options: ConversationManagerOptions;
  
  constructor(options: ConversationManagerOptions) {
    super();
    console.log('📢 Initializing speech recognition');
    this.options = options;
    
    // Bind methods
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.resetSilenceTimeout = this.resetSilenceTimeout.bind(this);
    this.finalizeTranscript = this.finalizeTranscript.bind(this);
    this.setConversationStatus = this.setConversationStatus.bind(this);
  }
  
  // Set conversation status and update related state
  public setConversationStatus(status: ConversationStatus): void {
    console.log(`🔄 Conversation status changing: ${this.state.status} -> ${status}`);
    
    // Update the appropriate flags based on status
    const newState: Partial<ConversationState> = {
      status: status
    };
    
    this.updateState(newState);
  }
  
  // Subscribe to state changes
  public subscribe(listener: ConversationStateListener): () => void {
    this.stateListeners.push(listener);
    // Immediately call with current state
    listener(this.state);
    // Return unsubscribe function
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }
  
  // Update state and notify subscribers
  public updateState(newState: Partial<ConversationState>): void {
    // Only log transcript changes when they're substantial
    if (newState.transcript !== undefined && 
        newState.transcript !== this.state.transcript && 
        newState.transcript.trim() !== '') {
      console.log(`🎙️ Transcript: "${newState.transcript}"`);
    }
    
    // Log status changes
    if (newState.status !== undefined && 
        newState.status !== this.state.status) {
      console.log(`🔄 Status: ${newState.status}`);
    }
    
    // Update the state and notify listeners
    this.state = { ...this.state, ...newState };
    this.stateListeners.forEach(listener => listener(this.state));
  }
  
  // Get current state
  public getState(): ConversationState {
    return { ...this.state };
  }
  
  // Initialize the session
  public initialize(): void {
    this.updateState({
      transcript: "",
      error: null,
      status: ConversationStatus.IDLE
    });
    this.accumulatedTranscript = "";
  }

  // Start recording user audio
  public async startRecording(): Promise<void> {
    console.log('🎤 Starting recording session');
    
    if (!this.options.deepgramApiKey) {
      console.error('❌ No Deepgram API key found');
      this.updateState({ error: "Deepgram API key is not configured" });
      return;
    }

    try {
      
      this.updateState({
        error: null,
        transcript: "",
      });
      
      // Ensure we're in IDLE status when starting to record
      if (this.state.status !== ConversationStatus.IDLE) {
        this.setConversationStatus(ConversationStatus.IDLE);
      }
      
      this.accumulatedTranscript = "";

      console.log('🎤 Requesting microphone access');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          noiseSuppression: true, 
          echoCancellation: true 
        }
      });

      const deepgram = createClient(this.options.deepgramApiKey);
      const dgConnection = await deepgram.listen.live({
        model: 'nova-3',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        punctuate: true
      });

      this.deepgramConnection = dgConnection;

      dgConnection.addListener(LiveTranscriptionEvents.Open, () => {
        console.log('🎤 Ready to record');
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && dgConnection.getReadyState() === 1) {
            dgConnection.send(event.data);
          }
        };

        recorder.start(250);
        this.mediaRecorder = recorder;
      });

      // Track the previous interim result to avoid duplicates
      let previousInterim = "";

      dgConnection.addListener(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionResponse) => {
        const transcriptText = data.channel.alternatives[0].transcript.trim();
        
        if (transcriptText) {
          // First check if we're in IDLE state - only process if we are
          if (this.state.status !== ConversationStatus.IDLE) {
            console.log(`🔇 Ignoring transcript in ${this.state.status} state: "${transcriptText}"`);
            return; // Skip all processing if not in IDLE state
          }
          
          // For UI updates, always show the latest transcript
          this.updateState({
            transcript: transcriptText
          });
          
          // For final results, add to our accumulated transcript
          if (data.is_final) {
            console.log(`🎙️ Final: "${transcriptText}"`);
            
            // Check if this is a new utterance or a duplicate
            if (!this.accumulatedTranscript.endsWith(transcriptText)) {
              // Append to accumulated transcript with appropriate spacing
              if (this.accumulatedTranscript) {
                this.accumulatedTranscript += ' ' + transcriptText;
              } else {
                this.accumulatedTranscript = transcriptText;
              }
              
              console.log(`📝 Accumulated transcript: "${this.accumulatedTranscript}"`);
            } else {
              console.log(`⚠️ Skipping duplicate transcript: "${transcriptText}"`);
            }
            
            // Reset previous interim
            previousInterim = "";
          } else {
            // For interim results, only log if different from previous
            if (transcriptText !== previousInterim) {
              console.log(`🎙️ Interim: "${transcriptText}"`);
              previousInterim = transcriptText;
            }
          }
          
          // Reset silence timer
          this.resetSilenceTimeout();
        }
      });
    

      dgConnection.addListener(LiveTranscriptionEvents.Error, (error: Error) => {
        console.error('❌ Deepgram error:', error);
        this.updateState({ error: 'Error during transcription. Please try again.' });
        this.stopRecording();
      });

      dgConnection.addListener(LiveTranscriptionEvents.Close, () => {
        console.log('🎤 Recording connection closed');
        if (this.accumulatedTranscript.trim()) {
          this.finalizeTranscript();
        }
      });

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      this.updateState({
        error: 'Failed to start recording. Please check your microphone permissions.',
      });
    }
  }
  
  // Stop recording user audio
  public stopRecording(): void {
    console.log('🛑 Stopping recording');
    this.updateState({
      transcript: ""
    });
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
    }
    
    if (this.deepgramConnection) {
      this.deepgramConnection.finish();
      this.deepgramConnection = null;
    }

    // Handle any remaining transcript
    if (this.accumulatedTranscript.trim()) {
      this.finalizeTranscript();
    }

    this.accumulatedTranscript = "";
  }
  
  // Reset silence timeout for detecting end of speech
  private resetSilenceTimeout(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    
    this.silenceTimeout = setTimeout(() => {
      console.log(`⏱️ Silence detected (${this.options.silenceThreshold}ms)`);
      this.finalizeTranscript();
    }, this.options.silenceThreshold);
  }
  
  // Start processing the response
  public startProcessing(): void {
    this.setConversationStatus(ConversationStatus.PROCESSING);
  }

  // Start speaking the response
  public startSpeaking(): void {
    this.setConversationStatus(ConversationStatus.SPEAKING);
  }

  // Return to idle state
  public returnToIdle(): void {
    this.setConversationStatus(ConversationStatus.IDLE);
  }
  
  // Finalize transcript
  private finalizeTranscript(): void {
    const finalTranscript = this.accumulatedTranscript.trim();
    
    // Only process the transcript if we're in IDLE state
    if (this.state.status === ConversationStatus.IDLE && finalTranscript) {
      console.log(`✅ TRANSCRIPT FINALIZED: "${finalTranscript}"`);
      
      // Update conversation history with the new transcript
      const updatedHistory = [
        ...this.state.conversationHistory,
        {
          role: 'user' as const, // Use const assertion to make TypeScript treat this as a literal
          content: finalTranscript,
          timestamp: Date.now()
        }
      ];
      
      // Set status to PROCESSING when a transcript is finalized
      this.startProcessing();
      
      // Update state with new conversation history
      this.updateState({
        transcript: "",
        conversationHistory: updatedHistory
      });
      
      this.accumulatedTranscript = "";
      
      // Emit an event with the final transcript
      this.emit('transcriptFinalized', {
        text: finalTranscript,
        timestamp: Date.now()
      });
    } else if (finalTranscript) {
      // If not in IDLE, just log that we're ignoring it and clear
      console.log(`🚫 TRANSCRIPT IGNORED (not in IDLE state): "${finalTranscript}"`);
      this.accumulatedTranscript = "";
      
      // Clear the UI transcript too
      this.updateState({
        transcript: ""
      });
    }
  }
  /**
   * Clean up resources
   */
  public dispose(): void {
    console.log('🧹 Cleaning up resources');
    this.stopRecording();
    this.stateListeners = [];
    this.removeAllListeners();
  }
}