
// Method templates for Task Set 1 
export const methodTemplatesSet1 = {
    "calculate_sum": `def calculate_sum(self, start: int, end: int) -> int:
      pass`,
    
    "create_pattern": `def create_pattern(self, numbers: list) -> str:
      pass`,
    
    "create_multiplier": `def create_multiplier(self, factor: int):
      pass`
  };
  
  // Method templates for Task Set 2 
  export const methodTemplatesSet2 = {
    "filter_high_scores": `def filter_high_scores(self, scores: dict, threshold: int) -> dict:
      pass`,
    
    "slice_string": `def slice_string(self, text: str, start: int, end: int, step: int) -> str:
      pass`,
    
    "flatten_matrix": `def flatten_matrix(self, matrix: list) -> list:
      pass`
  };
  
  // Function to get the correct template set based on session ID
  export function getTemplateSetForSession(sessionId: string) {
    console.log(`getTemplateSetForSession called with sessionId: ${sessionId}`);
    
    if (sessionId === '5') {
      console.log('Returning methodTemplatesSet1');
      return methodTemplatesSet1;
    } else if (sessionId === '12') {
      console.log('Returning methodTemplatesSet2');
      return methodTemplatesSet2;
    }
    
    // Default to set 1
    console.log('Returning default methodTemplatesSet1');
    return methodTemplatesSet1;
  }