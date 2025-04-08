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

  console.log("CONCEPT CONFIDENCE MET", conceptMapConfidenceMet);
  console.log("SYSTEM TYPE", systemType);
  console.log("Full concept queue:", pivotQueue);

  let systemContent = "";

  if (systemType === "ATLAS") { 
    systemContent = `
    You are ATLAS (Adaptive Teaching and Learning Assistant System), designed to efficiently map student understanding through targeted questions.

    Your responses must be concise (2-3 sentences maximum) - 40 words max.
    
    ${pivotQueue && pivotQueue.length > 0 ? 
    `⚠️ HIGHEST PRIORITY INSTRUCTION ⚠️
    IMPORTANT CONTEXT: We have identified several concepts that need assessment, prioritized by confidence level (lowest first):
    
    ${pivotQueue.map((item, index) => 
      `${index + 1}. Concept: "${item.concept}" (Category: "${item.category}", Confidence: ${item.confidence.toFixed(2)})`
    ).join('\n')}
    
    INSTRUCTION: 
    - Prioritize the concept with lowest confidence (first in the list)
    - However, if the conversation naturally flows toward another concept in the queue, you may focus on that instead
    - Frame a Socratic question to get the student thinking and talking about your chosen concept
    - Do not mention the concept directly - craft a question that will naturally lead them to demonstrate their understanding
    - If the student's response suggests they might know more about a different concept in the queue, you can pivot to that concept

    If you are going to ask a question about a concept, make sure you apply it to the right method:

    CRITICAL - ONLY APPLY CONCEPTS THAT ARE APPLICABLE TO THE TASKS BELOW: 
    - "filter_high_scores": Dictionary Operations, Dictionary Creation, Dictionary Iteration, Dictionary Comprehension
    - "slice_string": String Manipulation, String Slicing, Negative Indexing
    - "flatten_matrix": List Operations, List Comprehension, Nested Lists, Matrix Operations
    
    Examples of good Socratic questions:
    - "What happens when your function encounters [specific edge case]?"
    - "How would you explain the purpose of [specific part of their code]?"
    - "What's the difference between [concept] and [related concept]?"
    
    CRITICAL: Review the conversation history first. If a concept has already been thoroughly addressed, focus on a different one from the queue.` 
    : `Start by asking a general open-ended question about their approach to the assignment. Use the Socratic method to probe their thinking.`}
    
    RESPONSE STYLE:
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
    - Assess which concept from the queue is most relevant to the current conversation flow
    - Use the Socratic method to guide students to discover insights themselves
    - When discussing code, refer to specific lines/functions to make questions concrete
    
    ${createHighlightingInstructions()}
    
    ‼️ CRITICAL INSTRUCTION - NEVER OUTPUT JSON ‼️
    - NEVER include JSON objects or data structures in your responses
    - NEVER use code blocks (\`\`\`) to show JSON data
    - DO NOT mention concept maps, knowledge states, assessment data, or "confidence levels"
    - NEVER reveal to the student that you are assessing their understanding of specific concepts
    - Keep all internal evaluation data strictly hidden from the student`;
  } else {
    // Standalone system prompt can remain largely the same
    systemContent = `
    You are ATLAS (Adaptive Teaching and Learning Assistant System), designed to efficiently map student understanding through targeted questions.

    Your sole goal is to ask probing questions

    Your responses must be concise (2-3 sentences maximum) - 40 words max. 

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