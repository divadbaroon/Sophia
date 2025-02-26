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
      currentHistory.push({
        role: 'user',
        content: message
      });
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
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Claude API response:', data);
    
    // Add Claude's response to conversation history
    setConversationHistory(prev => {
      // If this is a new conversation, use the full initialized history
      if (prev.length === 0) {
        const initialHistory = initializeTeachingAssistantConversation(fileContext);
        
        // Add the user message if not in the initial prompt
        const updatedHistory = messageExists ? initialHistory : [...initialHistory, {
          role: 'user' as const,
          content: message
        }];
        
        // Add Claude's response
        return [...updatedHistory, {
          role: 'assistant' as const,
          content: data.content
        }];
      } else {
        // For ongoing conversations, just add the new messages
        const updatedHistory = messageExists ? prev : [...prev, {
          role: 'user' as const,
          content: message
        }];
        
        // Add Claude's response
        return [...updatedHistory, {
          role: 'assistant' as const,
          content: data.content
        }];
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error querying Claude API:', error);
    setError('Failed to get response from Claude. Please try again.');
    return null;
  } finally {
    setIsProcessing(false);
  }
}