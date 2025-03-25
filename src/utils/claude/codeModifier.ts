/**
 * Code helper utilities for extracting and formatting code
 */

/**
 * Adds line numbers to code blocks for easier reference
 * @param code - The raw code string
 * @returns Code with line numbers prepended to each line
 */
export function addLineNumbers(code: string): string {
    if (!code) return '';
    
    const lines = code.split('\n');
    const paddingSize = lines.length.toString().length;
    
    return lines.map((line, index) => {
      const lineNumber = (index + 1).toString().padStart(paddingSize, ' ');
      return `${lineNumber} | ${line}`;
    }).join('\n');
  }
  
  /**
   * Extracts the twoSum function from a larger code block
   * @param fullCode - The complete code containing the twoSum function
   * @returns Just the twoSum function code
   */
  export function extractTwoSumFunction(fullCode: string): string {
    // Try to extract the twoSum function with regular expressions
    const functionRegex = /def twoSum\(self,[\s\S]*?(?=\n\s*\n\s*def|\n\s*\n\s*#|\n\s*\n\s*$|\n\s*$)/;
    const match = fullCode.match(functionRegex);
    
    if (match && match[0]) {
      return match[0].trim();
    }
    
    // Fallback: try to extract based on indentation
    const lines = fullCode.split('\n');
    let inFunction = false;
    const functionLines = [];
    let indentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is the twoSum function definition
      if (line.includes('def twoSum(') || line.trim().startsWith('def twoSum(')) {
        inFunction = true;
        indentLevel = line.search(/\S|$/); // Get the indentation level of the function
        functionLines.push(line);
        continue;
      }
      
      // If we're in the function, add lines with the same or more indentation
      if (inFunction) {
        // If this is an empty line, add it
        if (line.trim() === '') {
          functionLines.push(line);
          continue;
        }
        
        const currentIndent = line.search(/\S|$/);
        
        // If indentation is less than the function definition, we're out of the function
        if (currentIndent <= indentLevel && line.trim() !== '') {
          break;
        }
        
        functionLines.push(line);
      }
    }
    
    return functionLines.length > 0 ? functionLines.join('\n') : 'def twoSum function not found';
  }