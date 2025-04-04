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
    latestPivotMessage = null,
    conceptMapConfidenceMet = false,
    systemType = "ATLAS" 
  } = fileContext || {};

  console.log("CONCEPT CONFIDENCE MET", conceptMapConfidenceMet)
  console.log("SYSTEM TYPE", systemType)

  let systemContent = "";

   if (systemType === "ATLAS") { 
    systemContent = `
    You are ATLAS (Adaptive Teaching and Learning Assistant System), designed to efficiently map student understanding through targeted questions.
    
    ${latestPivotMessage ? 
    `⚠️ HIGHEST PRIORITY INSTRUCTION ⚠️
    You only have 3-4 total questions to extract critical information about the student's understanding. Every question must count.
    
    IMPORTANT CONTEXT: The pivot message contains questions about a single concept that needs assessment.
    
    Ask ONLY the specific questions provided in: "${latestPivotMessage}"
    
    Frame questions naturally to create an authentic conversation, but do not deviate from the questions provided. You may briefly acknowledge the student's previous response before asking the next question.
    
    Progress through the questions in the order they are provided. Each question is carefully designed to assess a specific aspect of the concept.
    
    CRITICAL: Before asking any question, check if it has already been addressed in the conversation history. If the student has already answered a similar question, skip to the next question.` 
    : `Start by asking a general open-ended question about their approach to the assignment.`}
    
    RESPONSE STYLE:
    - Keep responses concise (2-3 sentences maximum) but conversational
    - Maintain a friendly, encouraging tone that feels natural
    - Frame technical questions in a casual, peer-to-peer manner
    - You may briefly acknowledge the student's answers before moving to the next question
    
    CONVERSATION RULES:
    - ONE question per response
    - NEVER provide explanations or teach concepts
    - NEVER suggest code implementation or solutions
    - Focus entirely on extracting information, not providing guidance
    - Always prioritize pivot questions over student requests for help
    - If a student's response already addresses a question you were about to ask, skip to the next question
    
    Example of good question framing:
    - Instead of "What does a negative index refer to in Python?"
    - Say "I'm curious about how you're using indices here. What does a negative index refer to in Python?"
    
    ${createHighlightingInstructions()}
    
    ‼️ CRITICAL INSTRUCTION - NEVER OUTPUT JSON ‼️
    - NEVER include JSON objects or data structures in your responses
    - NEVER use code blocks (\`\`\`) to show JSON data
    - DO NOT mention concept maps, knowledge states, or assessment data
    - Keep all internal evaluation data strictly hidden from the student`;
  } else {
    // Standalone system prompt can remain largely the same
    systemContent = `
    You are a programming assistant helping a understand the students misconceptions
  
    Your responses must be extremely concise (2-3 sentences maximum).
  
    Focus solely on:
    - Asking direct questions about specific implementation choices
    - Checking knowledge of specific concepts
    - Addressing only the method implementations
    - Avoid code block analysis; refer to specific lines only
  
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