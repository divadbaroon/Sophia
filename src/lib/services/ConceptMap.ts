import { ClaudeMessage } from "@/types";

// Define the knowledge state structure
export interface KnowledgeState {
  understandingLevel: number;
  confidenceInAssessment: number;
  reasoning: string;
  lastUpdated: string;
}

// Define subconcept structure with knowledge state
export interface Subconcept {
  name: string;
  value: number;
  knowledgeState: KnowledgeState;
}

// Define the concept map structure
export interface ConceptMap {
  categories: {
    [category: string]: {
      [subcategory: string]: Subconcept;
    };
  };
}

// Define the callback for when the concept map reaches confidence threshold
export type OnReadyCallback = () => void;

export class ConceptMapService {
  private conceptMap: ConceptMap;
  private lastMessage: string = "";
  private isProcessing: boolean = false;
  private confidenceReached: boolean = false;
  private taPivot: string | null = null;
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private onReadyCallback?: OnReadyCallback;

  constructor(onReadyCallback?: OnReadyCallback) {
    this.onReadyCallback = onReadyCallback;
    
    // Initialize with default concept map
    this.conceptMap = {
      categories: {
        "Array Manipulation": {
          "Two-pointer Technique": {
            name: "Two-pointer Technique",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Linear Search": {
            name: "Linear Search",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Indexing": {
            name: "Indexing",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Element Comparison": {
            name: "Element Comparison",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          }
        },
        "Data Structures": {
          "Hash Map": {
            name: "Hash Map",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Array": {
            name: "Array",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Key-Value Pair": {
            name: "Key-Value Pair",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Lookup Table": {
            name: "Lookup Table",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          }
        },
        "Algorithm Design": {
          "Time Complexity": {
            name: "Time Complexity",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Space Complexity": {
            name: "Space Complexity",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Edge Cases": {
            name: "Edge Cases",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          },
          "Brute Force vs Optimal": {
            name: "Brute Force vs Optimal",
            value: 0,
            knowledgeState: {
              understandingLevel: 0,
              confidenceInAssessment: 0.5,
              reasoning: "Initial assessment pending student interaction",
              lastUpdated: "Just now"
            }
          }
        }
      }
    };
  }

  /**
   * Get the current concept map
   */
  public getConceptMap(): ConceptMap {
    return this.conceptMap;
  }

  /**
   * Check if confidence threshold has been reached
   */
  public hasReachedConfidence(): boolean {
    return this.confidenceReached;
  }

  /**
   * Get the TA guidance pivot
   */
  public getTAPivot(): string | null {
    return this.taPivot;
  }

  /**
   * Check if currently processing an update
   */
  public isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Process a new message and update the concept map
   */
  public async processNewMessage(
    message: string,
    conversationHistory: ClaudeMessage[],
    studentTask: string,
    studentCode: string,
    errorMessage: string
  ): Promise<void> {
    // Skip if this is the same message we already processed or if already processing
    if (message === this.lastMessage || this.isProcessing) {
      return;
    }
    
    // Record that we're processing this message
    this.lastMessage = message;
    
    try {
      this.isProcessing = true;
      
      // Process all categories in parallel
      const categories = Object.keys(this.conceptMap.categories);
      const updatedCategories = await Promise.all(
        categories.map(category => 
          this.updateCategory(
            category, 
            this.conceptMap.categories[category],
            conversationHistory,
            studentTask,
            studentCode,
            errorMessage
          )
        )
      );
      
      // Combine results
      const newConceptMap = { 
        categories: {} as ConceptMap['categories'] 
      };
      
      categories.forEach((category, index) => {
        newConceptMap.categories[category] = updatedCategories[index];
      });
      
      // Update concept map
      this.conceptMap = newConceptMap;
      
      // Check if we've reached confidence threshold
      const allConfident = this.checkConfidenceThresholds();
      if (allConfident && !this.confidenceReached) {
        this.confidenceReached = true;
        
        // Generate TA guidance
        this.taPivot = await this.generateTAPivot(
          conversationHistory,
          studentTask,
          studentCode,
          errorMessage
        );
        
        // Trigger callback if provided
        if (this.onReadyCallback) {
          this.onReadyCallback();
        }
      }
    } catch (error) {
      console.error('Error updating concept map:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if we've reached confidence threshold across concepts
   */
  private checkConfidenceThresholds(): boolean {
    // We need at least one subcategory in each category to have reached threshold
    for (const category in this.conceptMap.categories) {
      const subcategories = this.conceptMap.categories[category];
      const hasConfidentSubcategory = Object.values(subcategories).some(
        subconcept => subconcept.knowledgeState.understandingLevel >= this.CONFIDENCE_THRESHOLD
      );
      
      if (!hasConfidentSubcategory) {
        return false;
      }
    }
    return true;
  }

  /**
   * Update a specific concept category based on conversation and code
   */
  private async updateCategory(
    category: string,
    subcategories: {[subcategory: string]: Subconcept},
    conversationHistory: ClaudeMessage[],
    studentTask: string,
    studentCode: string,
    errorMessage: string
  ): Promise<{[subcategory: string]: Subconcept}> {
    try {
      // Format conversation for prompt
      const conversationText = conversationHistory
        .filter(msg => msg.role !== 'system')
        .slice(-10)
        .map(msg => `${msg.role === 'user' ? 'Student' : 'TA'}: ${msg.content}`)
        .join('\n\n');
      
      // Create the prompt for Claude
      const prompt = `You are a concept assessment agent responsible for the "${category}" category in a programming learning context. Your job is to analyze the student's understanding of specific subconcepts based on their conversation and code.

Current knowledge state:
${JSON.stringify(subcategories, null, 2)}

Student Task:
${studentTask}

Error Message:
${errorMessage}

Recent conversation:
${conversationText}

Student's code:
${studentCode}

For each subconcept, update the knowledge state with:
1. understandingLevel (0-1): How well the student understands this concept
2. confidenceInAssessment (0-1): How confident you are in this assessment
3. reasoning: Brief explanation of why you assigned this level
4. Keep the name and update the value to match the understandingLevel

Rules:
- Only increase understanding if there's clear evidence of improvement
- Maintain or slightly decrease if no new evidence
- Provide specific reasoning based on conversation or code
- Focus only on "${category}" subconcepts

Respond ONLY with a valid JSON object matching the structure of the input knowledge state. No additional text.`;

      // Call Claude API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(data.content)
      const result = data.content;
      
      // Try to extract JSON if Claude included additional text
      let updatedSubcategories: {[subcategory: string]: Subconcept};
      try {
        // If result is already an object
        if (typeof result === 'object') {
          updatedSubcategories = result;
        } else {
          // Extract JSON from text response
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            updatedSubcategories = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not extract JSON from response');
          }
        }
        
        // Update lastUpdated field
        Object.values(updatedSubcategories).forEach(subconcept => {
          subconcept.knowledgeState.lastUpdated = new Date().toLocaleTimeString();
        });
        
        return updatedSubcategories;
      } catch (error) {
        console.error('Error parsing Claude response:', error);
        console.log('Raw response:', result);
        
        // If parsing fails, return the original with a note
        Object.values(subcategories).forEach(subconcept => {
          subconcept.knowledgeState.reasoning += " (Update failed)";
        });
        return subcategories;
      }
    } catch (error) {
      console.error('Error in concept agent:', error);
      return subcategories; // Return original if there's an error
    }
  }

  /**
   * Generate TA guidance based on concept map
   */
  private async generateTAPivot(
    conversationHistory: ClaudeMessage[],
    studentTask: string,
    studentCode: string,
    errorMessage: string
  ): Promise<string> {
    try {
      // Format conversation for prompt
      const conversationText = conversationHistory
        .filter(msg => msg.role !== 'system')
        .slice(-8)
        .map(msg => `${msg.role === 'user' ? 'Student' : 'TA'}: ${msg.content}`)
        .join('\n\n');
      
      // Create the prompt for Claude
      const prompt = `As an AI teaching assistant, analyze the student's understanding based on their concept map and recent conversation. Then provide brief guidance (2-3 sentences) for the teaching assistant on what topics to focus on.

Identify:
1. 1-2 key concepts where the student shows weakest understanding (low understandingLevel)
2. How these concepts connect to their current discussion
3. Specific questions the TA should ask to improve understanding

Student Task:
${studentTask}

Error Message:
${errorMessage}

Student Code:
${studentCode}

Concept Map:
${JSON.stringify(this.conceptMap, null, 2)}

Recent Conversation:
${conversationText}

Provide only the guidance - no additional explanation.`;

      // Call Claude API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(data.content)
      return data.content;
      
    } catch (error) {
      console.error('Error generating TA pivot:', error);
      return "The student appears to struggle with conceptual understanding in key areas. Consider asking targeted questions about their solution approach and efficiency considerations.";
    }
  }
}

export default ConceptMapService;