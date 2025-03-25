export interface ElevenLabsOptions {
  voiceId?: string; 
  stability?: number;
  similarityBoost?: number;
  modelId?: string;
}

export class ElevenLabsService {
  private options: ElevenLabsOptions;
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isLoading: boolean = false;
  private audioQueue: string[] = [];
  private audioContext: AudioContext | null = null;
  
  constructor(options: ElevenLabsOptions = {}) {
    this.options = {
      voiceId: 'JBFqnCBsd6RMkjVDRZzb', 
      stability: 0.5,
      similarityBoost: 0.75,
      modelId: 'eleven_multilingual_v2',
      ...options
    };
    
    // Initialize audio context on user interaction
    const initAudioContext = () => {
      if (!this.audioContext) {
        // Use proper type definition for AudioContext
        this.audioContext = new (window.AudioContext || 
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
    
    // Initialize on user interaction to comply with autoplay policies
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);
  }
  
  public async speak(text: string): Promise<Blob | null> {
    if (!text.trim()) return Promise.resolve(null);
    
    try {
      // Make API request directly without queueing
      const apiUrl = '/api/elevenlabs';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voiceId: this.options.voiceId,
          modelId: this.options.modelId,
          stability: this.options.stability,
          similarityBoost: this.options.similarityBoost
        })
      });
      
      if (!response.ok) {
        // Error handling
        throw new Error(`TTS error: ${response.status}`);
      }
      
      // Return the blob for ConversationManager to play
      return await response.blob();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }
  
  private async processQueue(): Promise<void> {
    // If queue is empty or already processing, return
    if (this.audioQueue.length === 0 || this.isLoading) {
      return Promise.resolve();
    }
    
    this.isLoading = true;
    const currentText = this.audioQueue.shift()!;
    
    try {
      const apiUrl = '/api/elevenlabs';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: currentText,
          voiceId: this.options.voiceId,
          modelId: this.options.modelId,
          stability: this.options.stability,
          similarityBoost: this.options.similarityBoost
        })
      });
      
      if (!response.ok) {
        let errorMessage = `Text-to-speech error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.log(e)
          errorMessage = `Text-to-speech error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Get the audio data directly (our API returns the raw audio)
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create an audio element
      this.audio = new Audio(audioUrl);
      this.isLoading = false;
      this.isPlaying = true;
      
      // Setup event listeners
      this.audio.onended = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        
        // Process next item in queue if any
        if (this.audioQueue.length > 0) {
          this.processQueue();
        }
      };
      
      this.audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        
        // Try next item
        if (this.audioQueue.length > 0) {
          this.processQueue();
        }
      };
      
      // Start playback
      await this.audio.play();
      
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      this.isLoading = false;
      this.isPlaying = false;
      
      // Process next item despite error
      if (this.audioQueue.length > 0) {
        this.processQueue();
      }
      
      throw error;
    }
  }
  
  public stop(): void {
    // Clear queue
    this.audioQueue = [];
    
    // Stop current audio if playing
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    }
  }
  
  public getPlaybackState(): { isPlaying: boolean; isLoading: boolean } {
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading
    };
  }
}