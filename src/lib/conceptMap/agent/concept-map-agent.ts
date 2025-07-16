import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { CONCEPT_MAP_SYSTEM_PROMPT } from '../prompt/conceptMapPrompts';
import { ConceptMapContextBuilder } from '../utils/contextBuilder';
import { ConceptMapAgentContext, ConceptMapAgentResponse } from "../types/types";

export class ConceptMapAgent {
  static async assessConceptMap(
    context: ConceptMapAgentContext
  ): Promise<ConceptMapAgentResponse> {
    try {
      const userPrompt = ConceptMapContextBuilder.buildUserPrompt(context);
      
      const result = await generateText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        system: CONCEPT_MAP_SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.3,
        maxTokens: 4000,
      });

      // Parse response
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const response = JSON.parse(jsonText);
      return {
        updatedConceptMap: response.updatedConceptMap,
      };

    } catch (error) {
      console.error('Error in concept map assessment:', error);
      return {
        updatedConceptMap: context.currentConceptMap,
      };
    }
  }
}