import { linkedListTestCases, supportedLinkedListMethods, linkClassDefinition } from "@/utils/testCases/LinkedListsTestCases"
import { binarySearchTreeTestCases, supportedBinarySearchTreeMethods, treeNodeClassDefinition } from "@/utils/testCases/BinarySearchTreeTestCases"
import { sortingTestCases, supportedSortingMethods } from "@/utils/testCases/SortingTestCases"

import { JavaTestCodeParams } from './types'

export const createJavaTestCode = ({ fileContent, activeMethodId, currentTestCases }: JavaTestCodeParams): string => {
  const allSupportedMethods = [...supportedLinkedListMethods, ...supportedBinarySearchTreeMethods, ...supportedSortingMethods]
  
  // Handle case where no test cases are available
  if (!activeMethodId || (!currentTestCases || currentTestCases.length === 0) && !allSupportedMethods.includes(activeMethodId)) {
    return createNoTestCasesCode(activeMethodId)
  }

  // Clean and prepare user code
  const cleanedFileContent = cleanUserCode(fileContent)
  
  // Inject appropriate class definitions
  const codeWithClassDefinitions = injectClassDefinitions(cleanedFileContent, activeMethodId)
  
  // Get test cases code
  const testCasesCode = getTestCasesCode(activeMethodId)
  
  // Generate helper methods
  const helperMethods = generateHelperMethods(activeMethodId)
  
  return buildCompleteJavaCode(codeWithClassDefinitions, helperMethods, testCasesCode)
}

// Helper function for when no test cases are available
const createNoTestCasesCode = (activeMethodId: string): string => {
  return `
public class Main {
    public static void main(String[] args) {
        System.out.println("⚠️ No test cases available for function '${activeMethodId}'");
        System.out.println("Please try selecting a different function or try again.");
    }
}`
}

// Clean user's code by removing unwanted elements
const cleanUserCode = (fileContent: string): string => {
  return fileContent
    .replace(/public\s+class\s+(\w+)/g, 'class $1') // Remove public from all classes
    .replace(/\/\/\s*Test method to demonstrate the solution[\s\S]*$/g, '') // Remove test methods and everything after
    .replace(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}/g, '') // Remove any existing main methods
    .replace(/\/\*\*[\s\S]*?\*\/\s*/g, '') // Remove class definition comments
    .trim() // Remove trailing whitespace
}

// Inject appropriate class definitions based on method type
const injectClassDefinitions = (cleanedContent: string, activeMethodId: string): string => {
  if (supportedLinkedListMethods.includes(activeMethodId)) {
    return linkClassDefinition + cleanedContent
  } else if (supportedBinarySearchTreeMethods.includes(activeMethodId)) {
    return treeNodeClassDefinition + cleanedContent
  }
  
  return cleanedContent
}

// Get test cases code for the active method
const getTestCasesCode = (activeMethodId: string): string => {
  // Check hardcoded test cases first
  if (linkedListTestCases[activeMethodId]) {
    return linkedListTestCases[activeMethodId]
  } else if (binarySearchTreeTestCases[activeMethodId]) {
    return binarySearchTreeTestCases[activeMethodId]
  } else if (sortingTestCases[activeMethodId]) {
    return sortingTestCases[activeMethodId]
  } else {
    // Fallback for database test cases
    return `
        System.out.println("Running test cases for ${activeMethodId} function:");
        System.out.println("==================================================");
        
        // Add your test cases here based on currentTestCases
        System.out.println("Test execution for " + "${activeMethodId}" + " not implemented yet.");`
  }
}

// Generate helper methods based on method type
const generateHelperMethods = (activeMethodId: string): string => {
  const helpers: string[] = []
  
  if (supportedLinkedListMethods.includes(activeMethodId)) {
    helpers.push(`
    // Helper method to print linked lists
    public static void printHelper(Link node) {
        Link current = node;
        while (current != null) {
            System.out.print(current.element);
            current = current.next;
            if (current != null) {
                System.out.print(" ");
            }
        }
    }`)
  }
  
  if (supportedBinarySearchTreeMethods.includes(activeMethodId)) {
    helpers.push(`
    // Helper method to print tree in-order (for debugging and tests)
    public static void printInOrderHelper(TreeNode node) {
        if (node != null) {
            printInOrderHelper(node.left);
            System.out.print(node.val + " ");
            printInOrderHelper(node.right);
        }
    }`)
  }
  
  if (supportedSortingMethods.includes(activeMethodId)) {
    helpers.push(`
    // Helper method to print arrays
    public static void printArrayHelper(int[] array) {
        for (int i = 0; i < array.length; i++) {
            System.out.print(array[i]);
            if (i < array.length - 1) {
                System.out.print(" ");
            }
        }
    }`)
  }
  
  return helpers.join('')
}

// Build the complete Java code
const buildCompleteJavaCode = (codeWithClasses: string, helperMethods: string, testCasesCode: string): string => {
  return `
${codeWithClasses}

public class Main {
    ${helperMethods}
    
    public static void main(String[] args) {
        ${testCasesCode}
    }
}`
}