import { addLineNumbers } from "./codeModifier";

// Define the interface for the context
interface StudentContext {
  fileContent: string
  errorContent: string
  studentTask: string
  executionOutput: string
  highlightedText: string
  lineNumber: number | null
}

/**
 * Prepares system message and context for Claude with proper priority order
 */
export function prepareClaudePrompt(context?: StudentContext | null): string {
  
  // Base system prompt with instructions
  let systemPrompt = `You're having a tutoring conversation with a CS student who got stuck on their programming assignment. Be the kind of supportive, knowledgeable tutor you'd want to have - someone who's patient, encouraging, and really good at explaining things clearly.

CONVERSATION APPROACH:
Keep the conversation natural and supportive - you're here to help them learn, not to lecture them.

IMPORTANT GUIDELINES YOU MUST FOLLOW IN YOUR RESPONSE:
- Keep responses short and conversational (2-3 sentences max)
- If the user is correct, let them know it looks good and ask if there is anything else they need help with
- Don't explain back to them what they just wrote correctly
- Avoid giving direct answers - provide guidance and let them work it out
- If they ask for syntax, give the general syntax pattern rather than their specific solution
- End responses with encouragement like "Give it a shot" or "Want to try that?"
- Focus on being a supportive friend, not a code reviewer
- Try not to repeat what has already been mentioned in the conversation unless necessary

SPECIAL INTERACTION FEATURES:
1. Text Highlighting: When students highlight code, you'll see "Student's highlighted text: [text]" - respond directly to highlighted sections
2. Code Line References: When discussing code, reference line numbers using "in line X" format - the system will highlight them automatically

SESSION MANAGEMENT:
Pay attention to when the student has worked through their main confusion. Once they understand and feel confident, offer to wrap up naturally.

Remember: Be conversational, empathetic, and genuinely helpful - like the best study partner they could have.`;

  // Add student context if available
  if (context) {
    const {
      fileContent = "",
      errorContent = "",
      studentTask = "",
      executionOutput = "",
      highlightedText = "",
      lineNumber = null
    } = context;

    // Build context sections in priority order
    const contextSections = [];

    // 1. Current Task (High Priority - what they're working on)
    if (studentTask) {
      contextSections.push(`
**CURRENT TASK:**
The user is currently attempting this task:
${studentTask}`);
    }

    // 2. Current Code (High Priority - what they've written)
    if (fileContent) {
      const numberedCode = addLineNumbers(fileContent);
      contextSections.push(`
**CURRENT CODE:**
This is their most up-to-date code:
\`\`\`python
${numberedCode}
\`\`\``);
    }

    // 3. Execution Output (Medium Priority - what happened when they ran it)
    if (executionOutput) {
      contextSections.push(`
**TERMINAL OUTPUT:**
This is their current terminal output:
\`\`\`
${executionOutput}
\`\`\``);
    }

    // 4. Error Messages (Medium Priority - what's broken)
    if (errorContent) {
      contextSections.push(`
**ERROR MESSAGES:**
This is the error they're seeing:
\`\`\`
${errorContent}
\`\`\``);
    }

    // 5. Highlighted Code (Medium Priority - what they're focusing on)
    if (highlightedText) {
      contextSections.push(`
**HIGHLIGHTED CODE:**
Here is code the user has highlighted:
\`\`\`python
${highlightedText}
\`\`\``);
    }

    // 6. Line Number Reference (Low Priority - supplementary info)
    if (lineNumber !== null) {
      contextSections.push(`
**LINE REFERENCE:**
Student is asking about line ${lineNumber}`);
    }

    // Add context sections to system prompt
    if (contextSections.length > 0) {
      systemPrompt += `

---

CURRENT STUDENT CONTEXT:
${contextSections.join('\n')}`;
    }
  }

  return systemPrompt;
}