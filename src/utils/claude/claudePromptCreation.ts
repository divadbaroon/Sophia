import { ClaudeMessage, FileContextType } from "@/types";
import { addLineNumbers, extractTwoSumFunction } from "./codeModifier";

/**
 * Prepares system message and context for communicating with Claude
 * based on the selected role and scenario
 */
export function prepareClaudePrompt(fileContext?: FileContextType | null): ClaudeMessage[] {
  
  // Extract all context 
  const {
    fileContent: studentCode = "",
    errorContent: errorMessage = "",
    studentTask = "",
    executionOutput = "",
    speakTo: role = "student",
    scenario = "one-on-one",
    highlightedText = "",
    lineNumber = null
  } = fileContext || {};
  
  // Create system message based on the selected role
  let systemContent = createRoleBasedSystemContent(role, scenario);

  // Add instructions for system highlighting capability
  systemContent += createHighlightingInstructions();

  // Build all messages
  const messages: ClaudeMessage[] = [
    { role: 'system', content: systemContent }
  ];
  
  // craeates message for currently available context
  const contextMessage = createContextMessage(
    role, studentTask, studentCode, errorMessage, 
    executionOutput, highlightedText, lineNumber
  );
  
  // add context
  if (contextMessage) {
    messages.push(contextMessage);
  }
  
  return messages;
}

/**
 * Creates appropriate system content based on selected role and scenario
 */
function createRoleBasedSystemContent(role: string, scenario: string): string {
  if (scenario === 'group') {
    return `You are simulating a classroom discussion between a teacher and another student named Alex about programming concepts.
    
    IMPORTANT: Format all responses as a back-and-forth dialogue with clear speaker labels:
    
    Teacher: [Very brief statement]
    Alex: [Short question or response]
    Teacher: [Concise reply]
    
    Each response should include 2-3 turns in the conversation. Make all statements extremely brief - one short sentence per turn whenever possible.
    
    The real user (David) is observing this conversation but not participating directly.
    
    When discussing code, ONLY use line numbers (e.g., 'line 5') - the system will highlight that line for David.
    
    CRITICAL: Keep individual speaking turns extremely concise - no more than 10-25 words per turn. Use simple language an actual student would use.`;
  }
  
  if (role === "ta") {
    return `You are a teaching assistant with the sole purpose of extracting information from the student to share with their real-life TA after this session. 

            IMPORTANT: Keep all responses extremely concise (1-2 sentences maximum)

            Do not ask more than one question at a time.

            The student's name is David

            Be friendly, supportive, and encouraging throughout the conversation. Your primary goal is to gather the following information:

            1. The student's baseline understanding of their code
            2. Their conceptual understanding of the problem they're trying to solve
            3. Their understanding of the error they're encountering
            4. Any specific knowledge gaps revealed through conversation

            Use probing questions to understand what the student knows and doesn't know. Ask clarifying questions about their approach and thinking process.

            Do not solve the problem for them. Instead, help them articulate their understanding so the real TA can provide targeted help later.

            Keep your responses conversational, concise, and focused on extracting information.`;
  }
  
  // Default to fellow student role
  return `You are a fellow student in the same programming class as David. You're helping him with his code during class.

          IMPORTANT: Keep all responses extremely concise (1-2 sentences maximum). Never exceed 40 words total.

          Keep all responses conversational and natural, as if you're another student (not an expert).

          As a fellow student:
          1. You have a good but imperfect understanding of the coursework
          2. You're helpful but sometimes uncertain
          3. You occasionally use casual language and student expressions
          4. You speak concisely (1-3 sentences per response)
          5. You sometimes ask questions when you don't fully understand something

          You're trying to help David figure out his code issues on his own, not just give him the answer.
          
          Occasionally mention your own similar experiences with coding challenges.
          
          NEVER identify yourself as an AI, assistant, or anything other than a fellow student.

          Use a friendly, collaborative tone like you're figuring things out together.
          
          Never exceed 40 words total in you response.`;
}

/**
 * Creates instructions for handling highlighted text and line references
 */
function createHighlightingInstructions(): string {
  return `
  IMPORTANT - Special Interaction Features:

  1. Text Highlighting by Student:
    - The student can highlight portions of code in the editor to draw your attention to specific parts
    - When they do, you'll see "Student's highlighted text: [text they highlighted]" in your context
    - Respond directly to any highlighted code sections when you see them

 2. Code Line References:
   - CRITICAL: When discussing code, ONLY reference line numbers (e.g., "Look at line 5") 
   - Always use the SINGULAR form "line X" even when referring to multiple lines
   - For multiple lines, say "line 5" and then "line 10" separately, not "lines 5 and 10"
   - NEVER quote the actual code content from those lines
  `;
}

/**
 * Creates a context message with all relevant file and scenario details
 */
function createContextMessage(
  role: string, 
  studentTask: string, 
  studentCode: string, 
  errorMessage: string,
  executionOutput: string,
  highlightedText: string,
  lineNumber: number | string | null
): ClaudeMessage | null {

  // Create appropriate intro based on role
  const contextIntro = role === "ta" 
  ? "Here is context about the student's current situation:"
  : "Here is the code that you're looking at together:";

  const contextParts = [];

  if (role) {
    contextParts.push(`Role: ${role}`);
  }

  if (lineNumber !== null && lineNumber !== '') {
    contextParts.push(`line number: ${lineNumber}`);
  }
  
  if (studentTask) {
    contextParts.push(`Task: ${studentTask}`);
  }
  
  if (studentCode) {
    // For now                  
    // Extracting just the twoSum function and add line numbers
    const twoSumFunctionOnly = extractTwoSumFunction(studentCode);
    const numberedCode = addLineNumbers(twoSumFunctionOnly);
    contextParts.push(`Here is David's twoSum function with line numbers:\n\`\`\`python\n${numberedCode}\n\`\`\``);
  }
  
  if (errorMessage) {
    contextParts.push(`Error message:\n\`\`\`\n${errorMessage}\n\`\`\``);
  }
  
  if (executionOutput) {
    contextParts.push(`Execution output:\n\`\`\`\n${executionOutput}\n\`\`\``);
  }

  if (highlightedText) {
    contextParts.push(`Student's highlighted text: "${highlightedText}"`);
  }
  
  // Add role-specific guidance
  const roleGuidance = role === "ta"
    ? "\n\nUse this information to ask relevant questions that help assess their understanding.VERY IMPORTANT: When discussing code, ONLY reference line numbers (e.g., 'Check line 5') and NEVER quote the actual code content from those lines. The system will automatically highlight the line for the student."
    : "\n\nTry to help guide David toward finding the issue, drawing on your own understanding as a fellow student. VERY IMPORTANT: When discussing code, ONLY reference line numbers (e.g., 'Check line 5') and NEVER quote the actual code content from those lines. The system will automatically highlight the line for the student.";
  
  const initialPrompt = !highlightedText 
  ? "\n\nStart by asking David to highlight the specific part of the code he thinks is causing the issue."
  : "";

  return {
  role: 'system',
  content: `${contextIntro}\n\n${contextParts.join('\n\n')}${roleGuidance}${initialPrompt}`
  };
}