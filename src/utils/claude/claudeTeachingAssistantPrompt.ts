import { ClaudeMessage, FileContextType } from "@/types";

/**
 * Prepares system message and context for Claude TA role using FileContext
 */
export function prepareTeachingAssistantPrompt(fileContext?: FileContextType | null): ClaudeMessage[] {
  console.log("prepareTeachingAssistantPrompt called with fileContext:", fileContext);
  
  // If no fileContext is provided, use defaults
  const studentCode = fileContext?.fileContent || "";
  const errorMessage = fileContext?.errorContent || "";
  const studentTask = fileContext?.studentTask || "";
  const executionOutput = fileContext?.executionOutput || "";

  console.log("STUDENT TASK:", studentTask);
  console.log("STUDENT CODE:", studentCode ? `${studentCode.length} chars` : "empty");
  console.log("ERROR MESSAGE:", errorMessage ? "present" : "none");
  console.log("EXECUTION OUTPUT:", executionOutput ? "present" : "none");
  
  // Create system message that explains Claude's role
  const systemMessage: ClaudeMessage = {
    role: 'system',
    content: `You are a teaching assistant with the sole purpose of extracting information from the student to share with their real-life TA after this session. 

            Keep all responses extremely concise (1-2 sentences maximum)

            Be friendly, supportive, and encouraging throughout the conversation. Your primary goal is to gather the following information:

            1. The student's baseline understanding of their code
            2. Their conceptual understanding of the problem they're trying to solve
            3. Their understanding of the error they're encountering
            4. Any specific knowledge gaps revealed through conversation

            Use probing questions to understand what the student knows and doesn't know. Ask clarifying questions about their approach and thinking process.

            Do not solve the problem for them. Instead, help them articulate their understanding so the real TA can provide targeted help later.

            Keep your responses conversational, concise, and focused on extracting information.`
  };

  // Prepare context information if provided
  let contextMessage: ClaudeMessage | null = null;
  
  if (studentTask || studentCode || errorMessage) {
    const contextParts = [];
    
    if (studentTask) {
      contextParts.push(`Task: ${studentTask}`);
    }
    
    if (studentCode) {
      contextParts.push(`Code:\n\`\`\`\n${studentCode}\n\`\`\``);
    }
    
    if (errorMessage) {
      contextParts.push(`Error message:\n\`\`\`\n${errorMessage}\n\`\`\``);
    }
    
    // Add execution output if available
    if (executionOutput) {
      contextParts.push(`Execution output:\n\`\`\`\n${executionOutput}\n\`\`\``);
    }
    
    contextMessage = {
      role: 'system',
      content: `Here is context about the student's current situation:\n\n${contextParts.join('\n\n')}\n\nUse this information to ask relevant questions that help assess their understanding.`
    };
  }
  
  // Combine all messages - DON'T include startingMessage here
  const messages: ClaudeMessage[] = [systemMessage];
  
  if (contextMessage) {
    messages.push(contextMessage);
  }
  
  return messages;
}