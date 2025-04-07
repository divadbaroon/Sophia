import { ClaudeMessage, FileContextType } from "@/types";
import { addLineNumbers } from "./codeModifier";

/**
 * Prepares system message and context for communicating with Claude
 */
export function prepareClaudePrompt(fileContext?: FileContextType | null): ClaudeMessage[] {
  
  // Extract all context 
  const {
    fileContent: studentCode = "",
    errorContent: errorMessage = "",
    studentTask = "",
    executionOutput = "",
    highlightedText = "",
    lineNumber = null,
    pivotQueue = null,
    conceptMapConfidenceMet = false,
    systemType = "ATLAS" 
  } = fileContext || {};

  // Handle pivot queue processing
  let currentPivotQuestion = null;
  let updatedPivotQueue = null;

  if (pivotQueue && pivotQueue.length > 0) {
    // Get the first question
    currentPivotQuestion = pivotQueue[0];
    
    // Create a new queue without the first item
    updatedPivotQueue = pivotQueue.slice(1);
    
    // Update the file context with the new queue
    if (fileContext && typeof fileContext.updatePivotQueue === 'function') {
      fileContext.updatePivotQueue(updatedPivotQueue);
      console.log("Updated pivot queue, removed first item");
      console.log("Current question:", currentPivotQuestion);
      console.log("Remaining queue:", updatedPivotQueue);
    }
  }

  console.log("CONCEPT CONFIDENCE MET", conceptMapConfidenceMet);
  console.log("SYSTEM TYPE", systemType);

  let systemContent = "";

   if (systemType === "ATLAS") { 
    systemContent = `
    You are ATLAS (Adaptive Teaching and Learning Assistant System), designed to efficiently map student understanding through targeted questions.

    Your responses must be concise (2-3 sentences maximum) - 40 words max.
    
    ${currentPivotQuestion ? 
    `⚠️ HIGHEST PRIORITY INSTRUCTION ⚠️
    IMPORTANT CONTEXT: The pivot message contains questions about a single concept that needs assessment.
    
    Ask ONLY the specific questions provided in: "${currentPivotQuestion}"
    
    Use the Socratic method: Ask questions that make students think deeper about their assumptions. Reference specific lines of their code when applicable to ground the discussion.
    
    Frame questions naturally to create an authentic conversation, but do not deviate from the questions provided. Acknowledge the student's previous response before pivoting to the next question.
    
    CRITICAL: Before asking any question, check if it has already been addressed in the conversation history. If the student has already answered a similar question, skip to the next question.` 
    : `Start by asking a general open-ended question about their approach to the assignment. Use the Socratic method to probe their thinking.`}
    
    RESPONSE STYLE:
    - Keep responses concise (2-3 sentences maximum) but conversational - 25 words max.
    - Maintain a friendly, encouraging tone that feels natural
    - Frame technical questions in a casual, peer-to-peer manner
    - You may briefly acknowledge the student's answers before moving to the next question
    - ALWAYS use Socratic questioning techniques to stimulate critical thinking
    - When relevant, refer to specific line numbers or code segments in the student's solution
    
    CONVERSATION RULES:
    - ONE question per response
    - NEVER provide explanations or teach concepts
    - NEVER suggest code implementation or solutions
    - Focus entirely on extracting information, not providing guidance
    - Always prioritize pivot questions over student requests for help
    - If a student's response already addresses a question you were about to ask, skip to the next question
    - Use the Socratic method to guide students to discover insights themselves
    - When discussing code, refer to specific lines/functions to make questions concrete
    
    ${createHighlightingInstructions()}
    
    ‼️ CRITICAL INSTRUCTION - NEVER OUTPUT JSON ‼️
    - NEVER include JSON objects or data structures in your responses
    - NEVER use code blocks (\`\`\`) to show JSON data
    - DO NOT mention concept maps, knowledge states, or assessment data
    - Keep all internal evaluation data strictly hidden from the student`;
  } else {
    // Standalone system prompt can remain largely the same
    systemContent = `
    You are ATLAS (Adaptive Teaching and Learning Assistant System), designed to efficiently map student understanding through targeted questions.

    Your sole goal is to ask probing questions

    Your responses must be extremely concise (2-3 sentences maximum) - 25 words max. 

    IMPORTANT:
    Be friendly, supportive, and encouraging throughout the conversation. Your goals are to:

    Do not focus on the method signatures and class structure, solely focus on the method implementations, as the structure was provided to the student for them

    Do not read blocks of code, just mention lines you are referring to.

    Do not tell them to adjust, implement, or redo anything they implement, you only ask questions about their understanding.
    
    ${createHighlightingInstructions()}
    `;
  }

  // Build all messages
  const messages: ClaudeMessage[] = [
    { role: 'system', content: systemContent }
  ];
  
  // Creates message for currently available context
  const contextMessage = createContextMessage(
    studentTask, studentCode, errorMessage, 
    executionOutput, highlightedText, lineNumber
  );
  
  // add context
  if (contextMessage) {
    messages.push(contextMessage);
  }

  return messages;
}

/**
 * Creates instructions for handling highlighted text and line references
 */
function createHighlightingInstructions(): string {
  return `
SPECIAL INTERACTION FEATURES:

1. Text Highlighting by Student:
  - You can instruct the student to highlight portions of their code in the editor which will include it as context to you
  - When they do, you'll see "Student's highlighted text: [text they highlighted]" in your context
  - Respond directly to any highlighted code sections when you see them

2. Code Line References:
  - CRITICAL: When discussing code, reference line numbers using the exact format "in line X" (e.g., "in line 5")
  - Reference only ONE line number at a time in each sentence
  - If you need to refer to multiple lines, use separate sentences for each line reference
  - NEVER quote the actual code content from those lines
  - The system will automatically highlight any line numbers you mention in this format
  `;
}

/**
 * Creates a context message with all relevant file and scenario details
 */
function createContextMessage(
  studentTask: string, 
  studentCode: string, 
  errorMessage: string,
  executionOutput: string,
  highlightedText: string,
  lineNumber: number | string | null,
): ClaudeMessage | null {
  // Same implementation as before
  const contextParts = [];

  if (studentTask) {
    contextParts.push(`Task: ${studentTask}`);
  }
  
  if (studentCode) {
    const numberedCode = addLineNumbers(studentCode);
    contextParts.push(`=== STUDENT CODE ===\n\`\`\`python\n${numberedCode}\n\`\`\``);
  }
  
  if (errorMessage) {
    contextParts.push(`=== ERROR MESSAGE ===\n\`\`\`\n${errorMessage}\n\`\`\``);
  }
  
  if (executionOutput) {
    contextParts.push(`=== EXECUTION OUTPUT ===\n\`\`\`\n${executionOutput}\n\`\`\``);
  }

  if (highlightedText) {
    contextParts.push(`=== HIGHLIGHTED TEXT ===\nStudent's highlighted text: "${highlightedText}"`);
  }

  if (lineNumber !== null && lineNumber !== '') {
    contextParts.push(`Line number: ${lineNumber}`);
  }
  
  return {
    role: 'system',
    content: `${contextParts.join('\n\n')}`
  };
}