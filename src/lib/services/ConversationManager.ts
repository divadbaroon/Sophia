import { createClient } from '@deepgram/sdk';
import { LiveTranscriptionEvents, LiveClient } from '@deepgram/sdk';
import { ClaudeMessage, LiveTranscriptionResponse } from "@/types";
import { queryClaudeAPI } from "@/lib/services/ClaudeService";
import { FileContextType } from '@/types';
import { ElevenLabsService } from '@/lib/services/ElevenLabsService';
import { prepareTeachingAssistantPrompt } from "@/utils/claude/claudeTeachingAssistantPrompt";

export interface ConversationManagerOptions {
  silenceThreshold: number; // ms before considering speech complete
  deepgramApiKey: string;
  fileContext: FileContextType;
}

export interface ConversationState {
  isRecording: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  conversationHistory: ClaudeMessage[];
  error: string | null;
  autoTTS: boolean;
}

export type ConversationStateListener = (state: ConversationState) => void;

export class ConversationManager {
  private state: ConversationState = {
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: "",
    conversationHistory: [],
    error: null,
    autoTTS: true
  };
  
  private mediaRecorder: MediaRecorder | null = null;
  private deepgramConnection: LiveClient | null = null;
  private accumulatedTranscript: string = "";
  private silenceTimeout: NodeJS.Timeout | null = null;
  private stateListeners: ConversationStateListener[] = [];
  private elevenLabsService: ElevenLabsService;
  private options: ConversationManagerOptions;
  
  constructor(options: ConversationManagerOptions, elevenLabsService: ElevenLabsService) {
    this.options = options;
    this.elevenLabsService = elevenLabsService;
    
    // Bind methods
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.resetSilenceTimeout = this.resetSilenceTimeout.bind(this);
    this.finalizeTranscript = this.finalizeTranscript.bind(this);
    this.queryClaudeWithText = this.queryClaudeWithText.bind(this);
  }
  
  // Subscribe to state changes
  public subscribe(listener: ConversationStateListener): () => void {
    this.stateListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }
  
  // Update state and notify subscribers
  private updateState(newState: Partial<ConversationState>): void {
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
      isRecording: false,
      isSpeaking: false,
      isProcessing: false,
      transcript: "",
      error: null
    });
    this.accumulatedTranscript = "";
  }
  
  // Clear error state
  public clearError(): void {
    console.log('Clearing error state');
    this.updateState({ error: null });
  }
  
  // Toggle auto TTS
  public toggleAutoTTS(): void {
    this.updateState({ autoTTS: !this.state.autoTTS });
  }
  
  // Speak last Claude response
  public speakLastClaudeResponse(): void {
    const lastAssistantMessage = this.findLastAssistantMessage();
    if (lastAssistantMessage) {
      this.elevenLabsService.speak(lastAssistantMessage.content)
        .catch(error => {
          this.updateState({ error: 'Failed to play text-to-speech: ' + error.message });
        });
    }
  }
  
  // Find the most recent assistant message
  private findLastAssistantMessage(): ClaudeMessage | null {
    const assistantMessages = this.state.conversationHistory.filter(
      message => message.role === 'assistant'
    );
    
    if (assistantMessages.length === 0) return null;
    return assistantMessages[assistantMessages.length - 1];
  }
  
  // Stop speech playback
  public stopSpeaking(): void {
    this.elevenLabsService.stop();
  }
  
  // Start recording user audio
  public async startRecording(): Promise<void> {
    console.log('Starting recording session');
    if (!this.options.deepgramApiKey) {
      console.error('No Deepgram API key found');
      this.updateState({ error: "Deepgram API key is not configured" });
      return;
    }

    try {
      // Stop any ongoing TTS before starting to record
      this.elevenLabsService.stop();
      
      this.updateState({
        error: null,
        isRecording: true,
        transcript: "",
        isSpeaking: false
      });
      
      this.accumulatedTranscript = "";

      console.log('Requesting microphone access');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          noiseSuppression: true, 
          echoCancellation: true 
        }
      });

      const deepgram = createClient(this.options.deepgramApiKey);
      console.log('Creating Deepgram connection');
      const dgConnection = await deepgram.listen.live({
        model: 'nova-3',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        punctuate: true
      });

      this.deepgramConnection = dgConnection;

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
        this.mediaRecorder = recorder;
      });

      dgConnection.addListener(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionResponse) => {
        const transcriptText = data.channel.alternatives[0].transcript.trim();
        
        if (transcriptText) {
          console.log('Received transcript:', {
            text: transcriptText,
            is_final: data.is_final,
            is_speaking: true
          });
          
          this.updateState({
            isSpeaking: true,
            transcript: transcriptText
          });
          
          // Accumulate transcript
          if (data.is_final) {
            console.log('Adding to accumulated transcript:', transcriptText);
            // Add space between segments if needed
            if (this.accumulatedTranscript && !this.accumulatedTranscript.endsWith(" ")) {
              this.accumulatedTranscript += " ";
            }
            this.accumulatedTranscript += transcriptText;
            console.log('Current accumulated:', this.accumulatedTranscript);
          }
          
          // Reset silence timer
          this.resetSilenceTimeout();
        } else {
          if (!data.is_final) {
            this.updateState({ transcript: "" });
          }
        }
      });

      dgConnection.addListener(LiveTranscriptionEvents.Error, (error: Error) => {
        console.error('Deepgram error:', error);
        this.updateState({ error: 'Error during transcription. Please try again.' });
        this.stopRecording();
      });

      dgConnection.addListener(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        if (this.accumulatedTranscript.trim()) {
          this.finalizeTranscript();
        }
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      this.updateState({
        error: 'Failed to start recording. Please check your microphone permissions.',
        isRecording: false
      });
    }
  }
  
  // Stop recording user audio
  public stopRecording(): void {
    console.log('Stopping recording');
    this.updateState({
      isRecording: false,
      isSpeaking: false,
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
    console.log('Resetting silence timeout');
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    
    this.silenceTimeout = setTimeout(() => {
      console.log(`Silence timeout triggered (${this.options.silenceThreshold}ms elapsed)`);
      this.finalizeTranscript();
    }, this.options.silenceThreshold);
  }
  
  // Finalize transcript and query Claude
  private finalizeTranscript(): void {
    console.log('Finalizing transcript after silence');
    console.log('Current accumulated transcript:', this.accumulatedTranscript);
    
    const finalTranscript = this.accumulatedTranscript.trim();
    if (finalTranscript) {
      console.log('Finalizing transcript:', finalTranscript);
      
      // Clear current transcript state
      this.updateState({
        transcript: "",
        isSpeaking: false
      });
      
      this.accumulatedTranscript = "";
      
      // Set a small timeout to ensure state has updated before querying Claude
      setTimeout(() => {
        console.log('Automatically querying Claude with finalized transcript');
        this.queryClaudeWithText(finalTranscript);
      }, 100);
    } else {
      console.log('No transcript to finalize');
    }
  }
  
  // Query Claude API with text
  public async queryClaudeWithText(text: string): Promise<void> {
    try {
      this.updateState({ isProcessing: true });
      
      let currentHistory = [...this.state.conversationHistory];
      
      // If this is a new conversation (no history), initialize with the teaching assistant prompt
      if (currentHistory.length === 0) {
        // Pass fileContext to initialize the conversation
        const initialPrompt = prepareTeachingAssistantPrompt(this.options.fileContext);
        currentHistory = initialPrompt;
        this.updateState({ conversationHistory: currentHistory });
      }
      
      // Add user message to history
      const userMessage = { role: 'user' as const, content: text };
      const updatedHistory = [...currentHistory, userMessage];
      this.updateState({ conversationHistory: updatedHistory });
      
      // Create adapters to work with React setState style functions
      const setConversationHistoryAdapter: React.Dispatch<React.SetStateAction<ClaudeMessage[]>> = 
        (value) => {
          if (typeof value === 'function') {
            // If it's a function, call it with current state to get new state
            const updaterFn = value as (prev: ClaudeMessage[]) => ClaudeMessage[];
            const newHistory = updaterFn(this.state.conversationHistory);
            this.updateState({ conversationHistory: newHistory });
          } else {
            // If it's a direct value, use it directly
            this.updateState({ conversationHistory: value });
          }
        };
      
      const setErrorAdapter: React.Dispatch<React.SetStateAction<string | null>> = 
        (value) => {
          if (typeof value === 'function') {
            // If it's a function, call it with current error to get new error
            const updaterFn = value as (prev: string | null) => string | null;
            const newError = updaterFn(this.state.error);
            this.updateState({ error: newError });
          } else {
            // If it's a direct value, use it directly
            this.updateState({ error: value });
          }
        };
      
      const setIsProcessingAdapter: React.Dispatch<React.SetStateAction<boolean>> = 
        (value) => {
          if (typeof value === 'function') {
            // If it's a function, call it with current isProcessing to get new value
            const updaterFn = value as (prev: boolean) => boolean;
            const newIsProcessing = updaterFn(this.state.isProcessing);
            this.updateState({ isProcessing: newIsProcessing });
          } else {
            // If it's a direct value, use it directly
            this.updateState({ isProcessing: value });
          }
        };
      
      // Send to Claude API using the React setState-compatible adapters
      const response = await queryClaudeAPI(
        text,
        this.state.conversationHistory,
        setConversationHistoryAdapter,
        setErrorAdapter,
        setIsProcessingAdapter,
        this.options.fileContext
      );
      
      // Play TTS if enabled
      if (this.state.autoTTS && response && response.content) {
        try {
          await this.elevenLabsService.speak(response.content);
        } catch (error) {
          console.error('TTS error:', error);
          
          // Don't show TTS errors to the user unless they specifically requested TTS
          // This prevents disrupting the normal conversation flow
          if (error instanceof Error && 
              !(error.message.includes('401') || error.message.includes('authentication'))) {
            this.updateState({ 
              error: 'Text-to-speech error: ' + (error instanceof Error ? error.message : String(error)) 
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Error querying Claude:', error);
      this.updateState({
        error: 'Failed to communicate with Claude: ' + (error instanceof Error ? error.message : String(error)),
        isProcessing: false
      });
    }
  }
  
  // Perform conceptual analysis of code
  public async analyzeCode(code: string): Promise<void> {
    const prompt = `Please analyze the following code and explain its purpose, structure, and any potential issues:\n\n${code}`;
    await this.queryClaudeWithText(prompt);
  }
  
  // Clean up resources
  public dispose(): void {
    this.stopRecording();
    this.stopSpeaking();
    this.stateListeners = [];
  }
}