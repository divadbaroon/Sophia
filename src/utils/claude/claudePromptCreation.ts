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
    conceptMapConfidenceMet = false
  } = fileContext || {};
  
  // Create the primary system message
  const systemContent = `
You are ATLAS (Adaptive Teaching and Learning Assistant System), an AI designed to assess and map students' understanding of programming concepts through thoughtful questioning.

Your goal is to identify conceptual gaps and misconceptions by asking probing questions about the student's code and understanding.

1. The student's baseline understanding of their code
2. Their conceptual understanding of the problem they're trying to solve
3. Their understanding of the error they're encountering
4. Any specific knowledge gaps revealed through conversation

Use probing questions to understand what the student knows and doesn't know. Ask clarifying questions about their approach and thinking process.

Do not solve the problem for them. Instead, help them articulate their understanding so the real TA can provide targeted help later.

Keep your responses conversational, concise, and focused on extracting information.

INTERACTION GUIDELINES:
- Be warm and approachable, but keep your responses brief (1-3 sentences maximum)
- Maintain a pleasant, compassionate tone while being concise
- When referring to code, use specific references like "line X in the Y method"
- If you need the student to identify specific code elements, instruct them to highlight those sections

QUESTIONING APPROACH:
- Start with open-ended questions before becoming more specific
- ${latestPivotMessage ? `Focus primarily on these concepts that need clarification: ${latestPivotMessage}` : 'Focus on identifying gaps in the student\'s implementation and understanding'}
- Follow a logical progression that builds on previous answers
- Ask one question at a time, waiting for a response before continuing
- Balance between validating correct understanding and probing deeper on misconceptions

IMPORTANT NOTES:
- Your primary purpose is to extract information about the student's conceptual understanding
- Do not provide direct solutions to the student's problems
- When concepts are correctly understood, briefly acknowledge this before moving to areas needing assessment
- If the student asks for help, redirect the conversation to continue your assessment

${createHighlightingInstructions()}

${conceptMapConfidenceMet ? "Based on our conversation, I can now provide a summary of your understanding. Would you like to see it?" : ""}`;

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
  
  // Keep the TextAnalyzer requirements
  const textAnalyzerInfo = `
=== TEXTANALYZER CLASS REQUIREMENTS ===

The TextAnalyzer class should implement the following methods:

1. count_words(text):
  - Counts how many times each word appears in a text string
  - Returns a dictionary where each key is a unique word and the value is the count
  - Words are case-sensitive (e.g., 'Hello' and 'hello' are different words)
  - Should handle empty strings
  - Should split text by whitespace
  - Examples:
    * count_words("hello world hello") → {"hello": 2, "world": 1}
    * count_words("one two two three three three") → {"one": 1, "two": 2, "three": 3}
    * count_words("") → {}

2. format_text(words):
  - Modifies a list of words by adding special markers
  - Inserts "START" at the beginning of the list and "END" at index position 3
  - Returns the new modified list without changing the original list
  - Examples:
    * format_text(["this", "is", "a", "test"]) → ["START", "this", "is", "END", "a", "test"]
    * format_text(["hello", "world"]) → ["START", "hello", "world", "END"]
    * format_text([]) → ["START", "END"]
  - Constraints:
    * Do not modify the original list, return a new list
    * Handle cases where the list has fewer than 3 elements
    * Always insert "START" at index 0 and "END" at index 3

3. create_word_filter(min_length):
  - Generates a custom word filter function
  - Returns a lambda function that takes a word as input
  - The returned function returns True if word length > min_length, otherwise False
  - Examples:
    * create_word_filter(4)("hello") → True
    * create_word_filter(4)("hi") → False
    * create_word_filter(0)("a") → True
    * create_word_filter(10)("python") → False
  - Constraints:
    * Must use a lambda function, not a regular function definition
    * The returned function must take exactly one parameter (the word)
    * The returned function must return a boolean value (True/False)

4. word_stats (property):
  - Analyzes the text stored in self.text and returns statistics as a dictionary
  - The dictionary should contain:
    * 'total_words': the total number of words
    * 'avg_length': the average word length rounded to 2 decimal places
  - Examples:
    * word_stats with "hello world python" → {'total_words': 3, 'avg_length': 5.33}
    * word_stats with "a b c d" → {'total_words': 4, 'avg_length': 1.0}
    * word_stats with "" → {'total_words': 0, 'avg_length': 0.0}
  - Constraints:
    * Must be implemented as a property using the @property decorator
    * Average length should be rounded to 2 decimal places
    * Handle empty text appropriately (shouldn't cause division by zero)
    * Use self.text as the source text to analyze
`;
  
  contextParts.push(textAnalyzerInfo);
  
  return {
    role: 'system',
    content: `${contextParts.join('\n\n')}`
  };
}