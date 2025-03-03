import { ClaudeMessage } from "@/types";
import { prepareTeachingAssistantPrompt } from "@/utils/claude/claudeTeachingAssistantPrompt";
import { FileContextType } from "@/types";

/**
 * Initializes a new conversation with Claude as a teaching assistant
 */
export function initializeTeachingAssistantConversation(
  fileContext?: FileContextType | null
): ClaudeMessage[] {
  return prepareTeachingAssistantPrompt(fileContext);
}

/**
 * Queries the Claude API with a message and conversation history
 * and streams the response sentence by sentence
 */
export async function queryClaudeAPI(
  message: string, 
  conversationHistory: ClaudeMessage[], 
  setConversationHistory: React.Dispatch<React.SetStateAction<ClaudeMessage[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  fileContext?: FileContextType | null,
) {
  try {
    setIsProcessing(true);
    
    // Get the current conversation history
    let currentHistory = [...conversationHistory];
    
    // If this is a new conversation (no history), initialize with the teaching assistant prompt
    if (currentHistory.length === 0) {
      // Pass fileContext to initialize the conversation
      currentHistory = initializeTeachingAssistantConversation(fileContext);
    }
    
    // Check if the message is already in the conversation history
    // This prevents duplicate messages if finalizeTranscript was already called
    const messageExists = currentHistory.some(
      msg => msg.role === 'user' && msg.content === message
    );
    
    // If message isn't already in history, add it
    if (!messageExists) {
      const userMessage: ClaudeMessage = {
        role: 'user',
        content: message
      };
      currentHistory.push(userMessage);
    }
    
    console.log('Querying Claude API with history:', currentHistory);
    
    // Prepare messages for the API call - FIXED FILTERING LOGIC
    // Extract system messages - these stay separate in the Claude API request
    const systemMessages = currentHistory.filter(msg => msg.role === 'system');
    
    // Get all non-system messages in proper sequence
    const nonSystemMessages = currentHistory.filter(msg => msg.role !== 'system');
    
    // Combine system messages if there are any
    const systemContent = systemMessages.length > 0 
      ? systemMessages.map(msg => msg.content).join('\n\n')
      : undefined;
      
    console.log('System content:', systemContent);
    console.log('Non-system messages:', nonSystemMessages);

    // Initialize variables for streaming
    let accumulatedText = '';
    let currentSentence = '';
    let fullResponse = '';
    
    // Create a temporary placeholder in the conversation history for the streaming response
    let tempMessageId: string | null = null;
    
    // If this is a new conversation, add the initial history + user message first
    if (conversationHistory.length === 0) {
      const initialHistory = initializeTeachingAssistantConversation(fileContext);
      
      if (!messageExists) {
        const userMessage: ClaudeMessage = {
          role: 'user',
          content: message
        };
        initialHistory.push(userMessage);
      }
      
      // Add a placeholder message for Claude's response
      const assistantMessage: ClaudeMessage = {
        role: 'assistant',
        content: ''
      };
      initialHistory.push(assistantMessage);
      
      setConversationHistory(initialHistory);
      tempMessageId = 'temp-response';
    } else {
      // For ongoing conversations, just add the user message if needed
      setConversationHistory(prev => {
        const updatedHistory = [...prev];
        
        if (!messageExists) {
          const userMessage: ClaudeMessage = {
            role: 'user',
            content: message
          };
          updatedHistory.push(userMessage);
        }
        
        // Add placeholder for Claude's response
        const assistantMessage: ClaudeMessage = {
          role: 'assistant',
          content: ''
        };
        updatedHistory.push(assistantMessage);
        
        return updatedHistory;
      });
    }
    
    // Make streaming request to Claude API
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

    // Set up stream reading
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      
      // Log the received chunk
      console.log(`[STREAM] Received chunk: "${chunk}"`);
      
      // Add to both the full response and the current text processing
      fullResponse += chunk;
      currentSentence += chunk;
      
      // Check if we've completed a sentence
      // This regex looks for sentence endings (.!?) followed by a space or end of text
      const sentenceRegex = /[.!?]\s+|[.!?]$/g;
      let match;
      let lastIndex = 0;
      
      // Find all completed sentences in this chunk
      while ((match = sentenceRegex.exec(currentSentence)) !== null) {
        const completedSentence = currentSentence.substring(lastIndex, match.index + 1);
        accumulatedText += completedSentence + (match[0].trim() === match[0] ? '' : ' ');
        lastIndex = match.index + match[0].length;
        
        // Log each completed sentence
        console.log(`[SENTENCE] Formed complete sentence: "${completedSentence}"`);
        console.log(`[SENTENCE] Accumulated text now: "${accumulatedText}"`); 
        
        // Update the response in the conversation history sentence by sentence
        setConversationHistory(prev => {
          const newHistory = [...prev];
          const lastIndex = newHistory.length - 1;
          
          const updatedAssistantMessage: ClaudeMessage = {
            role: 'assistant',
            content: accumulatedText
          };
          
          newHistory[lastIndex] = updatedAssistantMessage;
          return newHistory;
        });
      }
      
      // Keep the remaining partial sentence for the next iteration
      if (lastIndex > 0) {
        currentSentence = currentSentence.substring(lastIndex);
      }
    }
    
    // Add any remaining text that might not end with a sentence marker
    if (currentSentence.trim()) {
      accumulatedText += currentSentence;
      // Update conversation with final content
      setConversationHistory(prev => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        
        const finalAssistantMessage: ClaudeMessage = {
          role: 'assistant',
          content: accumulatedText
        };
        
        newHistory[lastIndex] = finalAssistantMessage;
        return newHistory;
      });
    }
    
    console.log(`[COMPLETE] Final streamed response: "${accumulatedText}"`);
    return { content: accumulatedText };
  } catch (error) {
    console.error('Error querying Claude API:', error);
    setError('Failed to get response from Claude. Please try again.');
    
    // Remove the placeholder message if there was an error
    setConversationHistory(prev => {
      // If the last message is an empty assistant message, remove it
      if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
        return prev.slice(0, -1);
      }
      return prev;
    });
    
    return null;
  } finally {
    setIsProcessing(false);
  }
}