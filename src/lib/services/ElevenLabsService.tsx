export interface TTSResponse {
  audioUrl: string;
  status: string;
}

export const textToSpeech = async (text: string, voiceId: string = "obDMvQMCqA8OIZn2IX30"): Promise<TTSResponse> => {
  try {
    console.log('ElevenLabsService: Starting TTS request for text length:', text.length);
    
    // Trim long texts to avoid issues (ElevenLabs has input limits)
    const MAX_TEXT_LENGTH = 5000;
    const trimmedText = text.length > MAX_TEXT_LENGTH 
      ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
      : text;
    
    if (trimmedText !== text) {
      console.log(`ElevenLabsService: Text was trimmed from ${text.length} to ${trimmedText.length} characters`);
    }
    
    // Use the correct endpoint: /api/elevenlabs
    console.log('ElevenLabsService: Calling /api/elevenlabs endpoint');
    const response = await fetch('/api/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: trimmedText,
        voiceId
      }),
    });

    console.log('ElevenLabsService: Received response with status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Failed to convert text to speech';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error response, just use the generic message
        console.error('ElevenLabsService: Failed to parse error response:', e);
      }
      throw new Error(`ElevenLabs API error (${response.status}): ${errorMessage}`);
    }

    // Get the audio blob from the response
    const audioBlob = await response.blob();
    console.log('ElevenLabsService: Got audio blob of size:', audioBlob.size);
    
    // Create a URL for the blob to use in audio elements
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log('ElevenLabsService: Created audio URL:', audioUrl);
    
    return {
      audioUrl,
      status: 'success'
    };
  } catch (error) {
    console.error('ElevenLabsService Error in text-to-speech conversion:', error);
    throw error;
  }
};