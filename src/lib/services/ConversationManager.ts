import { createClient } from '@deepgram/sdk';
import { LiveTranscriptionEvents, LiveClient } from '@deepgram/sdk';
import { ClaudeMessage, LiveTranscriptionResponse } from "@/types";
import { FileContextType, StreamingSentence, StreamingMessage, ConversationManagerOptions, ConversationState  } from '@/types';
import { ElevenLabsService } from '@/lib/services/ElevenLabsService';
import { prepareClaudePrompt } from "@/utils/claude/claudePromptCreation";
import { EventEmitter } from 'events';

// State listener type
export type ConversationStateListener = (state: ConversationState) => void;

export class ConversationManager extends EventEmitter {
  private state: ConversationState = {
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: "",
    conversationHistory: [],
    currentStreamingMessage: null,
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
  private audioElement: HTMLAudioElement | null = null;
  
  constructor(options: ConversationManagerOptions, elevenLabsService: ElevenLabsService) {
    super();
    this.options = options;
    this.elevenLabsService = elevenLabsService;
    
    // Create audio element for TTS
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.onplay = () => this.updateState({ isSpeaking: true });
      this.audioElement.onended = () => this.updateState({ isSpeaking: false });
      this.audioElement.onpause = () => this.updateState({ isSpeaking: false });
    }
    
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
    // Immediately call with current state
    listener(this.state);
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
    
    // Initialize conversation with prompt if not already initialized
    if (this.state.conversationHistory.length === 0) {
      this.initializeConversation(this.options.fileContext);
    }
  }
  
  /**
   * Initialize a new conversation with teaching assistant prompt
   */
  public initializeConversation(fileContext?: FileContextType | null): void {
    const initialMessages = prepareClaudePrompt(fileContext);
    this.updateState({ conversationHistory: initialMessages });
  }
  
  /**
   * Add a user message to the conversation
   */
  public addUserMessage(message: string): void {
    // Check if the message already exists
    const messageExists = this.state.conversationHistory.some(
      msg => msg.role === 'user' && msg.content === message
    );
    
    if (!messageExists) {
      const userMessage: ClaudeMessage = {
        role: 'user',
        content: message
      };
      
      const updatedHistory = [...this.state.conversationHistory, userMessage];
      this.updateState({ conversationHistory: updatedHistory });
    }
  }
  
  /**
   * Begin a new streaming assistant message
   */
  public beginStreamingMessage(): string {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create streaming message
    const streamingMessage: StreamingMessage = {
      id: messageId,
      role: 'assistant',
      sentences: [],
      content: '',
      isComplete: false,
      startTimestamp: Date.now(),
      endTimestamp: null
    };
    
    // Add an initial empty message to the conversation
    const initialMessage: ClaudeMessage = {
      role: 'assistant',
      content: ''
    };
    
    // Update state
    const updatedHistory = [...this.state.conversationHistory, initialMessage];
    this.updateState({ 
      conversationHistory: updatedHistory,
      currentStreamingMessage: streamingMessage
    });
    
    return messageId;
  }
  
  /**
   * Add a sentence to the current streaming message
   */
  public addSentence(text: string, isComplete: boolean = true): void {
    if (!this.state.currentStreamingMessage) {
      console.error('No streaming message in progress');
      return;
    }
    
    const sentence: StreamingSentence = {
      text,
      complete: isComplete,
      timestamp: Date.now()
    };
    
    // Create updated streaming message
    const updatedStreamingMessage = { ...this.state.currentStreamingMessage };
    updatedStreamingMessage.sentences.push(sentence);
    
    // Update the complete content
    updatedStreamingMessage.content = 
      updatedStreamingMessage.sentences
        .map(s => s.text)
        .join(' ')
        .replace(/\s+/g, ' '); // Clean up extra spaces
    
    console.log("UPDATED STREAMING MESSAGE: ", updatedStreamingMessage)

    // Update the message in the conversation history
    const updatedHistory = [...this.state.conversationHistory];
    const lastIndex = updatedHistory.length - 1;
    
    if (lastIndex >= 0 && updatedHistory[lastIndex].role === 'assistant') {
      updatedHistory[lastIndex] = {
        role: 'assistant',
        content: updatedStreamingMessage.content
      };
    }
    
    // Update state
    this.updateState({
      conversationHistory: updatedHistory,
      currentStreamingMessage: updatedStreamingMessage
    });
    
    // Emit an event about the sentence
    this.emit('sentenceAdded', {
      messageId: updatedStreamingMessage.id,
      sentence
    });
  }
  
  /**
   * Complete the current streaming message
   */
  public completeStreamingMessage(): void {
    if (!this.state.currentStreamingMessage) {
      console.error('No streaming message in progress');
      return;
    }
    
    const completedMessage = { ...this.state.currentStreamingMessage };
    completedMessage.isComplete = true;
    completedMessage.endTimestamp = Date.now();
    
    // Play TTS if enabled
    if (this.state.autoTTS) {
      this.speakLastClaudeResponse();
    }
    
    // Emit completed event
    this.emit('messageCompleted', {
      messageId: completedMessage.id,
      content: completedMessage.content,
      sentences: completedMessage.sentences,
      duration: completedMessage.endTimestamp - completedMessage.startTimestamp
    });
    
    // Clear the current streaming message
    this.updateState({ currentStreamingMessage: null });
  }
  
  /**
   * Handle an error during streaming
   */
  public handleStreamingError(error: Error): void {
    console.error('Streaming error:', error);
    
    // If there's a streaming message in progress, remove it
    if (this.state.currentStreamingMessage) {
      // Get an updated copy of the conversation history
      const updatedHistory = [...this.state.conversationHistory];
      const lastIndex = updatedHistory.length - 1;
      
      // Remove the last message if it's empty or incomplete
      if (lastIndex >= 0 && 
          updatedHistory[lastIndex].role === 'assistant' && 
          (!updatedHistory[lastIndex].content || 
           updatedHistory[lastIndex].content.trim() === '')) {
        updatedHistory.pop();
      }
      
      // Update state
      this.updateState({
        conversationHistory: updatedHistory,
        currentStreamingMessage: null,
        error: error.message || 'Failed to get response from Claude'
      });
    } else {
      this.updateState({ error: error.message || 'Failed to get response from Claude' });
    }
    
    // Emit error event
    this.emit('streamingError', { error });
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
    if (lastAssistantMessage && lastAssistantMessage.content.trim()) {
      this.elevenLabsService.speak(lastAssistantMessage.content)
        .then(audioBlob => {
          if (this.audioElement && audioBlob) {
            const audioUrl = URL.createObjectURL(audioBlob);
            this.audioElement.src = audioUrl;
            
            // Set up event handlers
            this.audioElement.onplay = () => {
              console.log('Audio playback started');
              this.updateState({ isSpeaking: true });
            };
            
            this.audioElement.onended = () => {
              console.log('Audio playback ended');
              this.updateState({ isSpeaking: false });
              URL.revokeObjectURL(audioUrl);
            };
            
            this.updateState({ isSpeaking: true });
            
            this.audioElement.play().catch(error => {
              console.error('Error playing audio:', error);
              this.updateState({ 
                error: 'Failed to play audio response',
                isSpeaking: false
              });
            });
            
            // Add a safety check - if 500ms after play() and still not playing, set isSpeaking manually
            setTimeout(() => {
              if (!this.audioElement?.paused && this.audioElement?.currentTime === 0) {
                console.log('Audio not playing after 500ms - manually setting isSpeaking');
                this.updateState({ isSpeaking: true });
              }
            }, 500);
          } else {
            console.log('No audioBlob returned from speak method');
          }
        })
        .catch(error => {
          console.error('TTS error:', error);
          this.updateState({ 
            error: 'Text-to-speech error: ' + (error instanceof Error ? error.message : String(error)),
            isSpeaking: false
          });
        });
    }
  }
  
  // Find the most recent assistant message
  private findLastAssistantMessage(): ClaudeMessage | null {
    const assistantMessages = this.state.conversationHistory.filter(
      message => message.role === 'assistant' && message.content.trim() !== ''
    );
    
    if (assistantMessages.length === 0) return null;
    return assistantMessages[assistantMessages.length - 1];
  }
  
  // Stop speech playback
  public stopSpeaking(): void {
    if (this.audioElement && this.state.isSpeaking) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.updateState({ isSpeaking: false });
    }
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
      this.stopSpeaking();
      
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
          
          // Stop any ongoing TTS when user speaks
          if (this.state.isSpeaking) {
            this.stopSpeaking();
          }
          
          // Update with user's transcript
          this.updateState({
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
  
  /**
   * Query Claude with text and handle streaming response
   */
  public async queryClaudeWithText(text: string): Promise<void> {
    if (!text.trim() || this.state.currentStreamingMessage !== null) {
      return;
    }
    
    try {
      this.updateState({ isProcessing: true });
      
      // Add user message to conversation
      this.addUserMessage(text);
      
      // Start a new streaming message
      const messageId = this.beginStreamingMessage();
      
      // Extract system messages for the API call
      const systemMessages = this.state.conversationHistory.filter(msg => msg.role === 'system');
      const nonSystemMessages = this.state.conversationHistory.filter(msg => 
        msg.role !== 'system' && (msg.role !== 'assistant' || msg.content.trim() !== '')
      );
      
      // Combine system messages if there are any
      const systemContent = systemMessages.length > 0 
        ? systemMessages.map(msg => msg.content).join('\n\n')
        : undefined;
      
      console.log('Querying Claude API with:', { 
        systemContent: systemContent ? 'Yes' : 'No', 
        messageCount: nonSystemMessages.length 
      });
      
      // Call streaming API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nonSystemMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          system: systemContent
        }),
      });
      
      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Setup stream processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let currentSentence = '';
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        console.log(`[STREAM] Received chunk: "${chunk}"`);
        
        currentSentence += chunk;
        
        // Check for complete sentences
        const sentenceRegex = /[.!?]\s+|[.!?]$/g;
        let match;
        let lastIndex = 0;
        
        // Find all completed sentences in the current text
        while ((match = sentenceRegex.exec(currentSentence)) !== null) {
          const completedSentence = currentSentence.substring(lastIndex, match.index + 1);
          lastIndex = match.index + match[0].length;
          
          console.log(`[SENTENCE] Formed complete sentence: "${completedSentence}"`);
          
          // Add the completed sentence to the conversation
          this.addSentence(completedSentence);
        }
        
        // Keep the remaining partial sentence
        if (lastIndex > 0) {
          currentSentence = currentSentence.substring(lastIndex);
        }
      }
      
      // Handle any remaining text that might not end with a sentence marker
      if (currentSentence.trim()) {
        console.log(`[SENTENCE] Adding remaining partial sentence: "${currentSentence.trim()}"`);
        this.addSentence(currentSentence.trim(), true);
      }
      
      // Mark the streaming as complete
      this.completeStreamingMessage();
      
      console.log(`[COMPLETE] Final streamed response completed`);
      
    } catch (error) {
      console.error('Error in queryClaudeWithText:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleStreamingError(new Error(errorMessage));
    } finally {
      this.updateState({ isProcessing: false });
    }
  }

  /**
   * Perform conceptual analysis of code
   */
  public async analyzeCode(code: string): Promise<void> {
    const prompt = `Please analyze the following code and explain its purpose, structure, and any potential issues:\n\n${code}`;
    await this.queryClaudeWithText(prompt);
  }
  
  /**
   * Get the current conversation history
   */
  public getConversationHistory(): ClaudeMessage[] {
    return [...this.state.conversationHistory];
  }
  
  /**
   * Check if a streaming message is in progress
   */
  public isStreaming(): boolean {
    return this.state.currentStreamingMessage !== null;
  }
  
  /**
   * Get information about the current streaming message
   */
  public getCurrentStreamingInfo(): {
    messageId: string;
    sentenceCount: number;
    content: string;
    duration: number;
  } | null {
    if (!this.state.currentStreamingMessage) {
      return null;
    }
    
    return {
      messageId: this.state.currentStreamingMessage.id,
      sentenceCount: this.state.currentStreamingMessage.sentences.length,
      content: this.state.currentStreamingMessage.content,
      duration: Date.now() - this.state.currentStreamingMessage.startTimestamp
    };
  }
  
  /**
   * Clear the conversation history
   */
  public clearConversation(): void {
    this.updateState({
      conversationHistory: [],
      currentStreamingMessage: null
    });
  }
  

  public async createUnderstandingMatrix(problemDescription: string): Promise<any> {
    // The example problem map to keep as a constant
    const exampleProblemMap = {
      "categories": {
        "String Processing": {
          "Parsing": 1,
          "Character Mapping": 1,
          "Pattern Recognition": 1,
          "Iteration Strategies": 1
        },
        "Data Structures": {
          "Hash Maps": 1,
          "Arrays": 1,
          "Stacks": 1,
          "Lists": 1
        },
        "Algorithm Design": {
          "Greedy Algorithm": 1,
          "Edge Case Handling": 1,
          "Time Complexity": 1,
          "Recursive Approach": 1
        }
      }
    };

    const prompt = `I am going to give you a coding problem description. Your Job is to come out with a LIST of about 3 categories and 4 subcategories for each category. You may you more or less than that but each category needs a subcategory. These will represent a mind map of the problem encompassing concepts that one needs to understand to take this problem. This mind map should be overarching enough to be reused for similar problems. Focus mostly on Computer Science categories and subcategories. Keep the names of the categories and short (at most 4 words). Json mode.

IMPORTANT: Your response must ONLY include a valid JSON object without any additional text or explanation before or after it. Use this exact format:

{
  "categories": {
    "Category Name": {
      "Subcategory 1": 1,
      "Subcategory 2": 1,
      "Subcategory 3": 1,
      "Subcategory 4": 1
    },
    ...more categories...
  }
}

Here is an example problem map for a different problem description than the one you are assigned:

${JSON.stringify(exampleProblemMap, null, 2)}

Here is your problem:

${problemDescription}`;

    try {
      this.updateState({ isProcessing: true });
      
      this.addUserMessage(prompt);
      
      const messageId = this.beginStreamingMessage();
      
      const systemMessages = this.state.conversationHistory.filter(msg => msg.role === 'system');
      const nonSystemMessages = this.state.conversationHistory.filter(msg => 
        msg.role !== 'system' && (msg.role !== 'assistant' || msg.content.trim() !== '')
      );
      
      const systemContent = systemMessages.length > 0 
        ? systemMessages.map(msg => msg.content).join('\n\n')
        : undefined;
      
      console.log('Creating understanding matrix with problem description:', { 
        systemContent: systemContent ? 'Yes' : 'No', 
        messageCount: nonSystemMessages.length 
      });
      
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nonSystemMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          system: systemContent
        }),
      });
      
      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let currentSentence = '';
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        currentSentence += chunk;
        
        const sentenceRegex = /[.!?]\s+|[.!?]$/g;
        let match;
        let lastIndex = 0;
        
        while ((match = sentenceRegex.exec(currentSentence)) !== null) {
          const completedSentence = currentSentence.substring(lastIndex, match.index + 1);
          lastIndex = match.index + match[0].length;
          
          this.addSentence(completedSentence);
        }
        
        if (lastIndex > 0) {
          currentSentence = currentSentence.substring(lastIndex);
        }
      }
      
      if (currentSentence.trim()) {
        this.addSentence(currentSentence.trim(), true);
      }
      
      this.completeStreamingMessage();
      
      try {
        console.log('Full response:', fullResponse);
        
        const firstBrace = fullResponse.indexOf('{');
        const lastBrace = fullResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonString = fullResponse.substring(firstBrace, lastBrace + 1);
          console.log('Extracted JSON string:', jsonString);
          
          try {
            const understandingMatrix = JSON.parse(jsonString);
            console.log('Understanding Matrix:', understandingMatrix);
            
            return understandingMatrix;
          } catch (jsonError) {
            console.error('Failed to parse extracted JSON:', jsonError);
            
            const cleanedJson = jsonString
              .replace(/[\r\n\t]/g, '')  // Remove newlines and tabs
              .replace(/,\s*}/g, '}')    // Remove trailing commas
              .replace(/,\s*]/g, ']');   // Remove trailing commas in arrays
            
            console.log('Cleaned JSON string:', cleanedJson);
            
            try {
              const understandingMatrix = JSON.parse(cleanedJson);
              console.log('Understanding Matrix (from cleaned JSON):', understandingMatrix);
              return understandingMatrix;
            } catch (cleanJsonError) {
              console.error('Failed to parse cleaned JSON:', cleanJsonError);
              
              try {
                const fallbackMatrix = {
                  categories: {
                    "Array Manipulation": {
                      "Two-pointer Technique": 1,
                      "Linear Search": 1,
                      "Indexing": 1,
                      "Element Comparison": 1
                    },
                    "Data Structures": {
                      "Hash Map": 1,
                      "Array": 1,
                      "Key-Value Pair": 1,
                      "Lookup Table": 1
                    },
                    "Algorithm Design": {
                      "Time Complexity": 1,
                      "Space Complexity": 1,
                      "Edge Cases": 1,
                      "Brute Force vs Optimal": 1
                    }
                  }
                };
                
                console.log('Using fallback understanding matrix:', fallbackMatrix);
                return fallbackMatrix;
              } catch (fallbackError) {
                console.error('Error creating fallback matrix:', fallbackError);
              }
            }
          }
        } else {
          console.error('Could not find JSON object in response');
          console.log('First brace index:', firstBrace);
          console.log('Last brace index:', lastBrace);
          
          const fallbackMatrix = {
            categories: {
              "Array Manipulation": {
                "Two-pointer Technique": 1,
                "Linear Search": 1,
                "Indexing": 1,
                "Element Comparison": 1
              },
              "Data Structures": {
                "Hash Map": 1,
                "Array": 1,
                "Key-Value Pair": 1,
                "Lookup Table": 1
              },
              "Algorithm Design": {
                "Time Complexity": 1,
                "Space Complexity": 1,
                "Edge Cases": 1,
                "Brute Force vs Optimal": 1
              }
            }
          };
          
          console.log('Using fallback understanding matrix:', fallbackMatrix);
          return fallbackMatrix;
        }
      } catch (jsonError) {
        console.error('Failed to parse understanding matrix:', jsonError);
        console.log('Raw response:', fullResponse);
        
        const fallbackMatrix = {
          categories: {
            "Array Manipulation": {
              "Two-pointer Technique": 1,
              "Linear Search": 1,
              "Indexing": 1,
              "Element Comparison": 1
            },
            "Data Structures": {
              "Hash Map": 1,
              "Array": 1,
              "Key-Value Pair": 1,
              "Lookup Table": 1
            },
            "Algorithm Design": {
              "Time Complexity": 1,
              "Space Complexity": 1,
              "Edge Cases": 1,
              "Brute Force vs Optimal": 1
            }
          }
        };
        
        console.log('Using fallback understanding matrix:', fallbackMatrix);
        return fallbackMatrix;
      }
      
    } catch (error) {
      console.error('Error in createUnderstandingMatrix:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleStreamingError(new Error(errorMessage));
      
      return {
        categories: {
          "Array Manipulation": {
            "Two-pointer Technique": 1,
            "Linear Search": 1,
            "Indexing": 1,
            "Element Comparison": 1
          },
          "Data Structures": {
            "Hash Map": 1,
            "Array": 1,
            "Key-Value Pair": 1,
            "Lookup Table": 1
          },
          "Algorithm Design": {
            "Time Complexity": 1,
            "Space Complexity": 1,
            "Edge Cases": 1,
            "Brute Force vs Optimal": 1
          }
        }
      };
    } finally {
      this.updateState({ isProcessing: false });
    }
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopRecording();
    this.stopSpeaking();
    this.stateListeners = [];
    this.removeAllListeners();
  }

  public createUnderstanding(fileContext: FileContextType): void {
    this.initializeConversation(fileContext);
  }

  public async createPivot(
    understandingMatrix: {
      categories: {
        [category: string]: {
          [subcategory: string]: number
        }
      }
    }
  ): Promise<string> {
    try {
      this.updateState({ isProcessing: true });
      
      const conversationHistory = this.getConversationHistory();
      
      const prompt = `As an AI teaching assistant, analyze the student's understanding matrix and recent conversation history. Then provide brief guidance (2-3 sentences) for the teaching assistant on what topics to steer the conversation toward.

Focus on identifying:
1. 1-2 key concepts where the student shows weakest understanding (scores below 0.5)
2. How these concepts connect to their current discussion
3. Specific conceptual questions the TA should ask to assess and improve understanding

This guidance is for the TA only and will not be shown to the student directly.

Understanding Matrix:
${JSON.stringify(understandingMatrix, null, 2)}

Recent Conversation:
${conversationHistory
  .filter(msg => msg.role !== 'system')
  .slice(-10)
  .map(msg => `${msg.role === 'user' ? 'Student' : 'TA'}: ${msg.content}`)
  .join('\n\n')
}

Example guidance:
- "The student shows weak understanding of hash maps (0.2) and time complexity (0.3). Guide the conversation toward how hash maps can improve the brute force solution's time complexity."
- "The student's understanding of edge cases is low (0.2). Ask questions about what might happen with empty arrays or duplicate values to strengthen this area."

Provide only the guidance without any additional explanation or commentary.`;

      const systemMessages = this.state.conversationHistory.filter(msg => msg.role === 'system');
      const nonSystemMessages = [{
        role: 'user' as const,
        content: prompt
      }];
      
      const systemContent = systemMessages.length > 0 
        ? systemMessages.map(msg => msg.content).join('\n\n')
        : undefined;
      
      console.log('Creating conversation pivot based on understanding matrix');
      
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nonSystemMessages,
          system: systemContent
        }),
      });
      
      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
      }
      
      console.log('Pivot guidance:', fullResponse);
      
      const cleanedResponse = fullResponse
        .replace(/^```.*$/gm, '') 
        .replace(/^>.*$/gm, '')   
        .replace(/^\s*[-*]\s*/gm, '') 
        .trim();
      
      return cleanedResponse;
      
    } catch (error) {
      console.error('Error in createPivot:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleStreamingError(new Error(errorMessage));
      
      return "The student may benefit from exploring hash maps and time complexity concepts. Consider asking how different data structures could improve their solution's efficiency.";
    } finally {
      this.updateState({ isProcessing: false });
    }
  }

  public async updateCategory(
    category: string, 
    currentUnderstanding: {[subcategory: string]: number}
  ): Promise<{[subcategory: string]: number}> {
    try {
      this.updateState({ isProcessing: true });
      
      const conversationHistory = this.getConversationHistory();
      const fileContext = this.options.fileContext;
      
      const studentCode = fileContext?.fileContent || "";
      
      const prompt = `You are given a problem description, a students code and a set of concepts to judge the students progress. You will be given the values of the students understanding before they made new changes to the code. Each category is given a score between 0 and 1. 0 being the student doesn't have any clue about the concept and a 1 being the student has shown that they understand the concept really well. All categories start at 0. You will also be given the conversation the student just had with a TA. 

Your job is to update the student's score. Do not lower a students score unless they have explicitly shown a misunderstanding of the concept. Json response only. Do not add anything else to your response.

Problem:
${fileContext?.studentTask || ""}

Student code:
${studentCode}

Conversation:
${conversationHistory
  .filter(msg => msg.role !== 'system')
  .map(msg => `${msg.role === 'user' ? 'Student' : 'TA'}: ${msg.content}`)
  .join('\n\n')
}

Categories:
"${category}": ${JSON.stringify(currentUnderstanding, null, 6)}`;


      console.log('Prompt:', prompt);
      const systemMessages = this.state.conversationHistory.filter(msg => msg.role === 'system');
      const nonSystemMessages = [{
        role: 'user' as const,
        content: prompt
      }];
      
      const systemContent = systemMessages.length > 0 
        ? systemMessages.map(msg => msg.content).join('\n\n')
        : undefined;
      
      console.log('Updating category understanding for:', { 
        category,
        currentUnderstanding,
        messageCount: nonSystemMessages.length 
      });
      
      // Call the Claude API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nonSystemMessages,
          system: systemContent
        }),
      });
      
      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
      }
      
      console.log('Full response:', fullResponse);
      
      try {
        const firstBrace = fullResponse.indexOf('{');
        const lastBrace = fullResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonString = fullResponse.substring(firstBrace, lastBrace + 1);
          console.log('Extracted JSON string:', jsonString);
          
          try {
            const updatedUnderstanding = JSON.parse(jsonString);
            
            if (typeof updatedUnderstanding === 'object' && 
                Object.keys(updatedUnderstanding).length > 0) {
              console.log('Updated understanding:', updatedUnderstanding);
              return updatedUnderstanding;
            } else {
              throw new Error('Invalid response format');
            }
          } catch (jsonError) {
            console.error('Failed to parse extracted JSON:', jsonError);
            
            const cleanedJson = jsonString
              .replace(/[\r\n\t]/g, '')
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']');
            
            try {
              const updatedUnderstanding = JSON.parse(cleanedJson);
              console.log('Updated understanding (from cleaned JSON):', updatedUnderstanding);
              return updatedUnderstanding;
            } catch (cleanJsonError) {
              console.error('Failed to parse cleaned JSON:', cleanJsonError);
              return currentUnderstanding;
            }
          }
        } else {
          console.error('Could not find JSON object in response');
          return currentUnderstanding;
        }
      } catch (error) {
        console.error('Error in updateCategory:', error);
        return currentUnderstanding;
      }
    } catch (error) {
      console.error('Error in updateCategory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleStreamingError(new Error(errorMessage));
      return currentUnderstanding;
    } finally {
      this.updateState({ isProcessing: false });
    }
  }
}