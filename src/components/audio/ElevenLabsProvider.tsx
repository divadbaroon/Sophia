import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';

interface ElevenLabsContextType {
  connectToVoice: (text: string) => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface ElevenLabsProviderProps {
  children: React.ReactNode;
  voiceId?: string;
  modelId?: string;
}

const ElevenLabsContext = createContext<ElevenLabsContextType | null>(null);

export const ElevenLabsProvider: React.FC<ElevenLabsProviderProps> = ({ 
  children, 
  voiceId = "obDMvQMCqA8OIZn2IX30",
  modelId = "eleven_turbo_v2" 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioQueue = useRef<AudioBuffer[]>([]);
  const isPlaying = useRef<boolean>(false);
  const isPendingConnection = useRef<boolean>(false);
  const pendingMessages = useRef<string[]>([]);

  // Initialize AudioContext
  const initializeAudioContext = useCallback(async () => {
    if (!audioContext.current) {
      try {
        const AudioContextClass = window.AudioContext;
        audioContext.current = new AudioContextClass();
        await audioContext.current.resume();
        console.log('AudioContext initialized successfully');
        setIsInitialized(true);
      } catch (err) {
        console.error('AudioContext initialization failed:', err);
        setError('Failed to initialize audio context');
      }
    }
  }, []);

  // Ensure initialization on mount
  useEffect(() => {
    const init = async () => {
      await initializeAudioContext();
    };
    init();

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isPendingConnection.current = false;
      pendingMessages.current = [];
    };
  }, [initializeAudioContext]);

  const playNextInQueue = useCallback(async () => {
    if (!audioContext.current || audioQueue.current.length === 0 || isPlaying.current) {
      return;
    }

    isPlaying.current = true;
    const audioBuffer = audioQueue.current.shift();
    if (!audioBuffer) return;

    try {
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      
      source.onended = () => {
        isPlaying.current = false;
        playNextInQueue();
      };

      await audioContext.current.resume();
      source.start(0);
    } catch (err) {
      console.error('Error playing audio:', err);
      isPlaying.current = false;
    }
  }, []);

  const processAudioChunk = useCallback(async (chunk: string) => {
    if (!audioContext.current || !isInitialized) {
      await initializeAudioContext();
    }

    try {
      const binaryAudio = atob(chunk);
      const arrayBuffer = new ArrayBuffer(binaryAudio.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryAudio.length; i++) {
        view[i] = binaryAudio.charCodeAt(i);
      }

      const audioBuffer = await audioContext.current!.decodeAudioData(arrayBuffer);
      audioQueue.current.push(audioBuffer);
      await playNextInQueue();
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      setError('Failed to process audio chunk');
    }
  }, [playNextInQueue, initializeAudioContext, isInitialized]);

  // Safe send function to avoid "Still in CONNECTING state" errors
  const safeSend = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
      return true;
    } else if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      // Queue the message to be sent when connection opens
      pendingMessages.current.push(message);
      return false;
    } else {
      console.warn('WebSocket is not in OPEN or CONNECTING state', 
                  wsRef.current ? `Current state: ${wsRef.current.readyState}` : 'WebSocket is null');
      return false;
    }
  }, []);

  // Function to process any pending messages once connected
  const processPendingMessages = useCallback(() => {
    if (pendingMessages.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log(`Processing ${pendingMessages.current.length} pending messages`);
      pendingMessages.current.forEach(message => {
        wsRef.current?.send(message);
      });
      pendingMessages.current = [];
    }
  }, []);

  // Function to initialize and maintain the websocket connection immediately on mount
  const initializeVoiceConnection = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Already connected
      return;
    }

    if (isPendingConnection.current) {
      console.log('Connection already in progress, waiting...');
      return;
    }

    isPendingConnection.current = true;
    console.log('Initializing ElevenLabs WebSocket connection...');
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}&output_format=mp3_44100`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('ElevenLabs WebSocket connected');
      setIsConnected(true);
      isPendingConnection.current = false;
      
      // Send initial config after connection is established
      const config = {
        text: " ",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        },
        generation_config: {
          chunk_length_schedule: [120, 160, 250, 290]
        },
        xi_api_key: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      };
      
      safeSend(JSON.stringify(config));
      processPendingMessages();
    };

    wsRef.current.onmessage = async (event) => {
      try {
        const response = JSON.parse(event.data);
        if (response.audio) {
          await processAudioChunk(response.audio);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        setError('Failed to process audio message');
      }
    };

    wsRef.current.onerror = (error) => {
      console.log('WebSocket error:', error);
      setError('WebSocket connection error');
      setIsConnected(false);
      isPendingConnection.current = false;
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
      isPendingConnection.current = false;
      // Optionally, you can implement a reconnection strategy here.
    };
  }, [voiceId, modelId, processAudioChunk, safeSend, processPendingMessages]);

  // Automatically initialize the connection when the provider mounts
  useEffect(() => {
    initializeVoiceConnection();
  }, [initializeVoiceConnection]);

  const connectToVoice = useCallback(async (text: string) => {
    if (!text.trim() || !process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
      console.error('Missing text or API key');
      return;
    }

    // Ensure WebSocket is open
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Initialize connection if needed
      initializeVoiceConnection();
      
      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 2.5 seconds max wait
        const checkInterval = setInterval(() => {
          attempts++;
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error('WebSocket connection timeout'));
          }
        }, 50);
      }).catch(err => {
        console.error('Failed to establish WebSocket connection:', err);
        setError('Connection timeout');
        throw err;
      });
    }
    
    console.log('Sending text to ElevenLabs:', text);
    safeSend(JSON.stringify({ text: text + " " }));
    safeSend(JSON.stringify({ text: "" }));
  }, [initializeVoiceConnection, safeSend]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    pendingMessages.current = [];
    setIsConnected(false);
    isPendingConnection.current = false;
  }, []);

  return (
    <ElevenLabsContext.Provider 
      value={{
        connectToVoice,
        disconnect,
        isConnected,
        error,
        isInitialized
      }}
    >
      {children}
    </ElevenLabsContext.Provider>
  );
};

export const useElevenLabs = () => {
  const context = useContext(ElevenLabsContext);
  if (!context) {
    throw new Error('useElevenLabs must be used within an ElevenLabsProvider');
  }
  return context;
};