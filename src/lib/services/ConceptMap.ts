import { ClaudeMessage } from "@/types";
import Anthropic from '@anthropic-ai/sdk';
 
export interface KnowledgeState {
  understandingLevel: number;
  confidenceInAssessment: number;
  reasoning: string;
  lastUpdated: string;
}

export interface Subconcept {
  name: string;
  value: number;
  knowledgeState: KnowledgeState;
}

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
  private anthropicClient: Anthropic | null = null;
  private fileContext: any = null
  private taPivotQueue: Array<{concept: string, category: string, confidence: number}> = [];

  constructor(initialConceptMap: ConceptMap, anthropicApiKey?: string, onReadyCallback?: OnReadyCallback, fileContext?: any) {
    this.conceptMap = initialConceptMap;
    this.onReadyCallback = onReadyCallback;
    this.fileContext = fileContext; // Store the fileContext
    
    // Initialize Anthropic client if API key is provided
    if (anthropicApiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: anthropicApiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  /**
   * Set the file context
   */
  public setFileContext(fileContext: any): void {
    this.fileContext = fileContext;
    console.log("FileContext has been set in ConceptMapService");
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
   * Set the Anthropic API key
   */
  public setAnthropicApiKey(apiKey: string): void {
    this.anthropicClient = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
 * Get the current TA pivot queue
 */
  public getTAPivotQueue(): Array<{concept: string, category: string, confidence: number}> {
    return this.taPivotQueue;
  }

  /**
 * Generate a simplified TA pivot queue with just concept names and confidence levels
 * @param conversationHistory - Recent conversation messages
 * @param studentTask - The task description for the student
 * @param studentCode - The student's current code
 * @param errorMessage - Any error message from the student's code
 * @param queueSize - Number of concepts to include in the queue (default: 5)
 * @returns An array of concept information objects
 */
public async generateTAPivotQueue(
  queueSize: number = 5
): Promise<Array<{concept: string, category: string, confidence: number}>> {
  console.log(`Generating simplified TA pivot queue for ${queueSize} concepts...`);
  const startTime = performance.now();
  
  try {
    // Get the prioritized concepts (already sorted by confidence level)
    const prioritizedConcepts = this.getPrioritizedConcepts();
    
    // Limit to the requested queue size or available concepts, whichever is smaller
    const conceptsToProcess = prioritizedConcepts.slice(0, Math.min(queueSize, prioritizedConcepts.length));
    
    // Log the concepts we'll be processing
    console.log(`Found ${conceptsToProcess.length} concepts to process for pivot queue`);
    conceptsToProcess.forEach((concept, index) => {
      console.log(`Queue position ${index + 1}: ${concept.category} - ${concept.subconcept} (confidence: ${concept.details.knowledgeState.confidenceInAssessment.toFixed(2)})`);
    });
    
    // If we have no concepts to process, return an empty queue
    if (conceptsToProcess.length === 0) {
      console.log("No concepts need assessment - returning empty queue");
      return [];
    }
    
    // Create a simplified queue with just concept names and confidence levels
    const simplifiedQueue = conceptsToProcess.map(concept => ({
      concept: concept.subconcept,
      category: concept.category,
      confidence: concept.details.knowledgeState.confidenceInAssessment
    }));
    
    const endTime = performance.now();
    console.log(`Generated ${simplifiedQueue.length} simplified TA pivots in ${(endTime - startTime).toFixed(2)}ms`);
    
    return simplifiedQueue;
  } catch (error) {
    console.error('Error generating simplified TA pivot queue:', error);
    const endTime = performance.now();
    console.log(`Error in TA pivot queue generation (${(endTime - startTime).toFixed(2)}ms)`);
    return [];
  }
}

  /**
 * Initialize the concept map and generate initial pivot queue
 * This function calibrates the concept map based on initial conversation state
 * and generates a queue of TA pivots
 * 
 * @param conversationHistory - Current conversation history
 * @param studentTask - The task description for the student
 * @param studentCode - The student's current code
 * @param errorMessage - Any error message from the student's code
 * @param queueSize - Number of concepts to include in the pivot queue (default: 5)
 * @returns Promise that resolves when initialization is complete
 */
public async initialize(
  conversationHistory: ClaudeMessage[],
  studentTask: string,
  studentCode: string,
  errorMessage: string = "",
  queueSize: number = 5
): Promise<void> {
  console.log("Initializing concept map and pivot queue...");
  const startTime = performance.now();
  
  try {
    this.isProcessing = true;

    if (this.fileContext && typeof this.fileContext.updateConceptMapInitializing === 'function') {
      this.fileContext.updateConceptMapInitializing(true);
      console.log("Set concept map initializing state to TRUE");
    }
    
    // Step 1: Run an initial calibration of the concept map
    console.log("Performing initial concept map calibration");
    const calibrationStartTime = performance.now();
    
    // Get all categories that need assessment (should be all categories initially)
    const categoriesNeedingAssessment = Object.keys(this.conceptMap.categories);
    console.log(`Found ${categoriesNeedingAssessment.length} categories for initial calibration`);
    
    // Process all categories in parallel
    const updatedCategories = await Promise.all(
      categoriesNeedingAssessment.map(category => 
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
    
    // Update concept map with calibration results
    const newConceptMap: ConceptMap = { 
      categories: {...this.conceptMap.categories} // Create a copy
    };
    
    // Update all categories
    categoriesNeedingAssessment.forEach((category, index) => {
      newConceptMap.categories[category] = updatedCategories[index];
    });
    
    // Replace the concept map
    this.conceptMap = newConceptMap;
    
    const calibrationEndTime = performance.now();
    console.log(`Initial calibration completed in ${(calibrationEndTime - calibrationStartTime).toFixed(2)}ms`);
    
    // Step 2: Check confidence thresholds
    const allConfident = this.checkConfidenceThresholds();
    
    if (allConfident) {
      this.confidenceReached = true;
      console.log("Concept map already reached confidence threshold after initial calibration");
      
      if (this.fileContext && typeof this.fileContext.updateConceptMapConfidence === 'function') {
        this.fileContext.updateConceptMapConfidence(true);
      }
    }
    
    // Generate TA pivot queue
    console.log(`Generating initial TA pivot queue (size ${queueSize})`);
    this.taPivotQueue = await this.generateTAPivotQueue(
      queueSize
    );
    
    // Update file context with queue if available
    if (this.fileContext && typeof this.fileContext.updatePivotQueue === 'function') {
      this.fileContext.updatePivotQueue(this.taPivotQueue);
    }
    
    // Call the onReadyCallback if provided
    if (this.onReadyCallback) {
      console.log("Calling onReadyCallback after initialization");
      this.onReadyCallback();
    }
    
    const endTime = performance.now();
    console.log(`Concept map initialization completed in ${(endTime - startTime).toFixed(2)}ms`);

    if (this.fileContext && typeof this.fileContext.updateConceptMapInitializing === 'function') {
      this.fileContext.updateConceptMapInitializing(false);
      console.log("Set concept map initializing state to FALSE - initialization complete");
    }
    
  } catch (error) {
    console.error('Error during concept map initialization:', error);

    if (this.fileContext && typeof this.fileContext.updateConceptMapInitializing === 'function') {
      this.fileContext.updateConceptMapInitializing(false);
      console.log("Set concept map initializing state to FALSE - initialization complete");
    }
    
    throw error; // Re-throw the error to allow caller to handle it
  } finally {
    this.isProcessing = false;
  }
}

/**
 * Process a new message and update the concept map
 * Modified to exclude concepts that have reached confidence threshold and include timing logs
 */
public async processNewMessage(
  message: string,
  conversationHistory: ClaudeMessage[],
  studentTask: string,
  studentCode: string,
  errorMessage: string,
  fileContext?: any
): Promise<void> {
  // Skip if this is the same message we already processed or if already processing
  if (message === this.lastMessage || this.isProcessing) {
    return;
  }
  
  // Record that we're processing this message
  this.lastMessage = message;
  
  try {
    // Start total process timing
    const totalStartTime = performance.now();
    this.isProcessing = true;
    console.log("Processing new message for concept map");
    
    // Start categories filtering timing
    const categoriesStartTime = performance.now();
    // Determine which categories still need assessment
    const categoriesNeedingAssessment = this.getCategoriesNeedingAssessment();
    const categoriesEndTime = performance.now();
    console.log(`Found ${categoriesNeedingAssessment.length} categories still needing assessment (${(categoriesEndTime - categoriesStartTime).toFixed(2)}ms)`);
    
    // Start API calls timing
    const apiCallsStartTime = performance.now();
    // Only process categories that haven't reached confidence threshold
    const updatedCategories = await Promise.all(
      categoriesNeedingAssessment.map(category => 
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
    const apiCallsEndTime = performance.now();
    console.log(`API calls for ${categoriesNeedingAssessment.length} categories completed (${(apiCallsEndTime - apiCallsStartTime).toFixed(2)}ms)`);
    
    // Start map update timing
    const mapUpdateStartTime = performance.now();
    // Update only the categories that were processed
    // For others, keep their existing values in the concept map
    const newConceptMap: ConceptMap = { 
      categories: {...this.conceptMap.categories} // Create a copy of the existing map
    };
    
    // Update only the categories we just processed
    categoriesNeedingAssessment.forEach((category, index) => {
      newConceptMap.categories[category] = updatedCategories[index];
    });
    
    // Update concept map
    this.conceptMap = newConceptMap;
    const mapUpdateEndTime = performance.now();
    console.log(`Concept map update completed (${(mapUpdateEndTime - mapUpdateStartTime).toFixed(2)}ms)`);
    
    // Start confidence check timing
    const confidenceStartTime = performance.now();
    // Rest of the method remains the same...
    const allConfident = this.checkConfidenceThresholds();
    
    if (allConfident) {
      this.confidenceReached = true;
      
      if (fileContext && typeof fileContext.updateConceptMapConfidence === 'function') {
        fileContext.updateConceptMapConfidence(true);
      }
    }
    const confidenceEndTime = performance.now();
    console.log(`Confidence check completed (${(confidenceEndTime - confidenceStartTime).toFixed(2)}ms)`);
    
    // ADD THIS SECTION: Regenerate the pivot queue
    const queueStartTime = performance.now();
    console.log("Regenerating TA pivot queue after message processing");
    
    // Default queue size (5) or use a configurable value
    const queueSize = 5;
    this.taPivotQueue = await this.generateTAPivotQueue(queueSize);
    
    // Update file context with new queue if available
    if (fileContext && typeof fileContext.updatePivotQueue === 'function') {
      fileContext.updatePivotQueue(this.taPivotQueue);
    }
    
    const queueEndTime = performance.now();
    console.log(`Pivot queue regeneration completed (${(queueEndTime - queueStartTime).toFixed(2)}ms)`);
    
    // Log total process time
    const totalEndTime = performance.now();
    console.log(`Total concept map processing completed (${(totalEndTime - totalStartTime).toFixed(2)}ms)`);
  } catch (error) {
    console.error('Error updating concept map:', error);
  } finally {
    this.isProcessing = false;
  }
}

/**
 * Get categories that still need assessment (confidence below threshold)
 */
private getCategoriesNeedingAssessment(): string[] {
  const categoriesNeeded: string[] = [];
  
  for (const category in this.conceptMap.categories) {
    const subcategories = this.conceptMap.categories[category];
    
    // Check if any subconcepts in this category have low confidence
    const needsMoreAssessment = Object.values(subcategories).some(
      subconcept => subconcept.knowledgeState.confidenceInAssessment < this.CONFIDENCE_THRESHOLD
    );
    
    if (needsMoreAssessment) {
      categoriesNeeded.push(category);
    } else {
      console.log(`Skipping category "${category}" - already reached confidence threshold`);
    }
  }
  
  return categoriesNeeded;
}

 /**
 * Updated to check confidenceInAssessment instead of understandingLevel
 */
private checkConfidenceThresholds(): boolean {
  // Track if we're newly reaching the threshold
  const previouslyReached = this.confidenceReached;
  
  // Log the current confidence levels for debugging
  console.log("Checking concept map confidence levels:");
  
  let allCategoriesConfident = true;
  
  for (const category in this.conceptMap.categories) {
    const subcategories = this.conceptMap.categories[category];
    
    // Check if all subconcepts in this category have high confidence in assessment
    const allSubconceptsConfident = Object.values(subcategories).every(
      subconcept => subconcept.knowledgeState.confidenceInAssessment >= this.CONFIDENCE_THRESHOLD
    );
    
    // Find lowest confidence in this category
    const lowestConfidence = Math.min(
      ...Object.values(subcategories).map(s => s.knowledgeState.confidenceInAssessment)
    );
    
    console.log(`Category ${category} - lowest confidence level: ${lowestConfidence.toFixed(2)}, all confident: ${allSubconceptsConfident}`);
    
    if (!allSubconceptsConfident) {
      allCategoriesConfident = false;
    }
  }
  
  // If we get here and allCategoriesConfident is true, all subcategories have high confidence
  if (allCategoriesConfident) {
    console.log("All subconcepts have reached confidence threshold!");
    
    // Check if this is a new change to confidence level
    if (!previouslyReached) {
      console.log("📊 System Confidence level has been reached");
      
      // Safely try to update the fileContext
      if (this.fileContext && typeof this.fileContext.updateConceptMapConfidence === 'function') {
        try {
          this.fileContext.updateConceptMapConfidence(true);
          console.log("✅ FileContext confidence state updated to true in checkConfidenceThresholds");
        } catch (error) {
          console.error("Error updating conceptMapConfidence:", error);
        }
      } else {
        console.warn("⚠️ Could not update fileContext in checkConfidenceThresholds - not available or missing method");
      }
    }
    
    return true;
  } else {
    console.log("Some subconcepts have not yet reached confidence threshold");
    return false;
  }
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
  const startTime = performance.now();
  try {
    // Format conversation for prompt
    const conversationText = conversationHistory
      .filter(msg => msg.role !== 'system')
      .slice(-10)
      .map(msg => `${msg.role === 'user' ? 'Student' : 'TA'}: ${msg.content}`)
      .join('\n\n');
    
    // Create the prompt for Claude
    const prompt = `You are a concept assessment agent responsible for the "${category}" category in a programming learning context. Your job is to analyze the student's understanding of specific subconcepts based on their conversation and code

                    ## Current Knowledge State
                    \`\`\`json
                    ${JSON.stringify(subcategories, null, 2)}
                    \`\`\`

                    ## Context
                    - Student Task: ${studentTask}
                    - Error Message: ${errorMessage || "None provided"}

                    ## Conversation History
                    Recent conversation:
                    \`\`\`
                    ${conversationText}
                    \`\`\`

                    Student's code:
                    \`\`\`
                    ${studentCode || "No code provided"}
                    \`\`\`

                    ## Assessment Instructions
                    For each subconcept in the knowledge state, provide an updated assessment with:

                    1. \`understandingLevel\` (0-1 scale):
                      - 0.0-0.2: Minimal/no understanding/ student did not implement
                      - 0.2-0.4: Basic awareness with significant gaps
                      - 0.4-0.6: Moderate understanding with some misconceptions
                      - 0.6-0.8: Strong understanding with minor gaps
                      - 0.8-1.0: Comprehensive mastery with application ability

                    2. \`confidenceInAssessment\` (0-1 scale):
                      - 0.0-0.3: Very low (insufficient evidence)
                      - 0.3-0.6: Moderate (some evidence but limited)
                      - 0.6-0.8: Substantial (clear evidence)
                      - 0.8-1.0: High (Demonstrates conceptual knowledge through code and verbal confirmaton)

                    CRITICAL RULE FOR LOW UNDERSTANDING CONCEPTS:
                    For any concept where understandingLevel is below 0.4:
                    - Confidence should NOT exceed 0.6 unless the student has explicitly addressed their understanding of concept, this could include stating they do not understand it at all
                    - Evidence must be direct (student mentions their understanding of the concept, this could include stating they do not understand it at all)
                    - This means the student must answer a direct question regarding the concept before your confidence for the concept can increase
                    - Inference from related concepts is not sufficient to establish high confidence

                    3. \`reasoning\`: Brief, specific explanation citing concrete evidence

                    - Focus EXCLUSIVELY on "${category}" subconcepts

                    ## Response Format
                    Respond ONLY with a valid JSON object matching the structure of the input knowledge state. No additional text or explanation.`;

    // Log pre-API call time
    const apiCallStartTime = performance.now();
    console.log(`Prepared API call for "${category}" (${(apiCallStartTime - startTime).toFixed(2)}ms)`);

    // Throw an error if no Anthropic client is available
    if (!this.anthropicClient) {
      throw new Error('No Anthropic client available');
    }

    // Use non-streaming API
    const response = await this.anthropicClient.messages.create({
      system: "You are a concept assessment agent for programming education. Respond only with a valid JSON object matching the structure requested.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
    });

    // Log API call completion time
    const apiCallEndTime = performance.now();
    console.log(`API call for "${category}" completed (${(apiCallEndTime - apiCallStartTime).toFixed(2)}ms)`);

    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response from Claude API');
    }

    const contentBlock = response.content[0];
    // Check if it's a text block
    if (contentBlock.type !== 'text') {
      throw new Error(`Unexpected content block type: ${contentBlock.type}`);
    }

    const result = contentBlock.text;
    
    // Start parsing time
    const parsingStartTime = performance.now();
    
    // Try to extract JSON 
    let updatedSubcategories: {[subcategory: string]: Subconcept};
    try {
      // If result is already an object
      if (typeof result === 'object' && result !== null) {
        updatedSubcategories = result as {[subcategory: string]: Subconcept};
      } else if (typeof result === 'string') {
        // Extract JSON from text response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          updatedSubcategories = JSON.parse(jsonMatch[0]) as {[subcategory: string]: Subconcept};
        } else {
          console.log('Raw response (no JSON found):', result);
          throw new Error('Could not extract JSON from response');
        }
      } else {
        throw new Error('Unexpected response format');
      }
      
      // Update lastUpdated field
      Object.values(updatedSubcategories).forEach(subconcept => {
        subconcept.knowledgeState.lastUpdated = new Date().toLocaleTimeString();
      });
      
      const endTime = performance.now();
      console.log(`Parsing response for "${category}" (${(endTime - parsingStartTime).toFixed(2)}ms)`);
      console.log(`Total processing for "${category}" (${(endTime - startTime).toFixed(2)}ms)`);
      
      return updatedSubcategories;
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      console.log('Raw response:', result);
      
      // If parsing fails, return the original with a note
      Object.values(subcategories).forEach(subconcept => {
        subconcept.knowledgeState.reasoning += " (Update failed)";
      });
      
      const endTime = performance.now();
      console.log(`Error handling for "${category}" (${(endTime - parsingStartTime).toFixed(2)}ms)`);
      console.log(`Total processing for "${category}" (${(endTime - startTime).toFixed(2)}ms)`);
      
      return subcategories;
    }
  } catch (error) {
    console.error('Error in concept agent:', error);
    const endTime = performance.now();
    console.log(`Error processing "${category}" (${(endTime - startTime).toFixed(2)}ms)`);
    return subcategories; // Return original if there's an error
  }
}

/**
 * Generate TA guidance based on concept map
 * With manual filtering and ranking of concepts
 */
private async generateTAPivot(
  conversationHistory: ClaudeMessage[],
  studentTask: string,
  studentCode: string,
  errorMessage: string
): Promise<string> {
  const startTime = performance.now();
  try {
    // Format conversation for prompt
    const conversationText = conversationHistory
      .filter(msg => msg.role !== 'system')
      .slice(-8)
      .map(msg => `${msg.role === 'user' ? 'Student' : 'TA'}: ${msg.content}`)
      .join('\n\n');
    
    // Start concept filtering timing
    const filterStartTime = performance.now();
    // Get prioritized concepts
    const prioritizedConcepts = this.getPrioritizedConcepts();
    
    // Check if we have any concepts to assess
    if (prioritizedConcepts.length === 0) {
      return "All concepts have been assessed with high confidence. The student appears to have a good understanding of the required concepts.";
    }
    
    // Focus only on the single lowest concept
    const lowestConcept = prioritizedConcepts[0];
    console.log(`Focusing on concept: ${lowestConcept.category} - ${lowestConcept.subconcept}`);
    
    const filterEndTime = performance.now();
    console.log(`Concept filtering completed (${(filterEndTime - filterStartTime).toFixed(2)}ms)`);
    
    // Create the prompt for Claude
    const promptStartTime = performance.now();
    const prompt = `As the concept mapping agent for ATLAS, focus entirely on assessing the student's understanding of a single concept.

                    OBJECTIVE: Generate 1-3 extremely concise questions to assess the student's understanding of this specific concept.
                    
                    FOCUS CONCEPT: ${lowestConcept.subconcept} (from category: ${lowestConcept.category})
                    Current understanding level: ${lowestConcept.details.knowledgeState.understandingLevel.toFixed(2)}
                    Current confidence in assessment: ${lowestConcept.details.knowledgeState.confidenceInAssessment.toFixed(2)}
                    
                    QUESTION REQUIREMENTS:
                    - EXTREMELY BRIEF (max 10 words per question)
                    - Focus on CONCEPTUAL UNDERSTANDING, not problem-solving
                    - NO code examples for students to complete
                    - Simple enough to answer verbally
                    - Direct and to the point
                    
                    GOOD EXAMPLES:
                    - "What does a list comprehension do?"
                    - "When would you use dictionary vs. list?"
                    - "How do lambda functions work?"
                    - "What's the purpose of the 'self' parameter?"
                    
                    BAD EXAMPLES:
                    - "Rewrite this for loop using a list comprehension: for x in range..."
                    - "Explain how you would implement a function that..."
                    - "What would be the output of the following code..."
                    
                    RESPONSE FORMAT:
                    - CONCEPT: ${lowestConcept.subconcept}
                    - QUESTIONS:
                      1. [First direct question]
                      2. [Second direct question]
                      3. [Third direct question]
                    
                    CONTEXT:
                    Student Task: ${studentTask}
                    Conversation History: ${conversationText}
                    Student Code: ${studentCode}
                    Error Message: ${errorMessage}`;
                                
    const promptEndTime = performance.now();
    console.log(`Prompt preparation completed (${(promptEndTime - promptStartTime).toFixed(2)}ms)`);

    console.log("Generating TA pivot focused on single lowest concept");

    // Throw an error if no Anthropic client is available
    if (!this.anthropicClient) {
      throw new Error('No Anthropic client available');
    }
    
    // Use non-streaming API
    const response = await this.anthropicClient.messages.create({
      system: "You are a teaching assistant conducting a focused assessment of a student's understanding of a specific programming concept.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 512,
    });
    
    // Process response
    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response from Claude API');
    }

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error(`Unexpected content block type: ${contentBlock.type}`);
    }

    const result = contentBlock.text;
    
    const endTime = performance.now();
    console.log(`Total TA pivot generation completed (${(endTime - startTime).toFixed(2)}ms)`);
    
    return result.trim();
  } catch (error) {
    console.error('Error generating TA pivot:', error);
    const endTime = performance.now();
    console.log(`Error in TA pivot generation (${(endTime - startTime).toFixed(2)}ms)`);
    return "Focus on areas where we need more information about the student's understanding. Ask targeted questions about concepts where we have both low understanding assessment and low confidence in that assessment.";
  }
}

/**
 * Get filtered and prioritized concepts based on understanding and confidence levels
 */
private getPrioritizedConcepts(): Array<{
  category: string;
  subconcept: string;
  details: Subconcept;
}> {
  const filteredConcepts: Array<{
    category: string;
    subconcept: string; 
    details: Subconcept;
  }> = [];
  
  // Go through all concepts and filter based on criteria
  for (const category in this.conceptMap.categories) {
    const subcategories = this.conceptMap.categories[category];
    
    for (const subconcept in subcategories) {
      const details = subcategories[subconcept];
      
      // Filter for low confidence only
      if (details.knowledgeState.confidenceInAssessment < 0.7) {
        filteredConcepts.push({
          category,
          subconcept,
          details
        });
      }
    }
  }
  
  // Sort the concepts by confidence level (ascending)
  const sortedConcepts = filteredConcepts.sort((a, b) => {
    return a.details.knowledgeState.confidenceInAssessment - b.details.knowledgeState.confidenceInAssessment;
  });
  
  console.log(`Found ${filteredConcepts.length} concepts with low confidence, sorted by confidence level`);
  
  return sortedConcepts;
}

}

export default ConceptMapService;