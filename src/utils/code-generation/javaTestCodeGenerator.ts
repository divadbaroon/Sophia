import { linkedListTestCases, supportedLinkedListMethods, linkClassDefinition } from "@/utils/testCases/LinkedListsTestCases"
import { binarySearchTreeTestCases, supportedBinarySearchTreeMethods, treeNodeClassDefinition } from "@/utils/testCases/BinarySearchTreeTestCases"
import { sortingTestCases, supportedSortingMethods } from "@/utils/testCases/SortingTestCases"
import { hashTableTestCases, supportedHashTableMethods } from "@/utils/testCases/HashTablesTestCases"
import { graphAlgorithmTestCases, supportedGraphAlgorithmMethods } from "@/utils/testCases/GraphAlgorithmsTestCases"

import { JavaTestCodeParams } from './types'

export const createJavaTestCode = ({ fileContent, activeMethodId, currentTestCases }: JavaTestCodeParams): string => {
  // strp parentheses from the method ID to match our test case keys
  const cleanMethodId = activeMethodId ? activeMethodId.replace(/\(\)/g, '') : ''
  
  console.log("Original activeMethodId:", activeMethodId)
  console.log("Cleaned methodId:", cleanMethodId)
  
  const allSupportedMethods = [
    ...supportedLinkedListMethods, 
    ...supportedBinarySearchTreeMethods, 
    ...supportedSortingMethods,
    ...supportedHashTableMethods,
    ...supportedGraphAlgorithmMethods
  ]
  
  console.log("Checking if", cleanMethodId, "is in supported methods:", allSupportedMethods.includes(cleanMethodId))
  
  // Check if we have hardcoded test cases for this method
  const hasHardcodedTests = allSupportedMethods.includes(cleanMethodId)
  
  // Handle case where no test cases are available
  if (!cleanMethodId) {
    return createNoTestCasesCode(activeMethodId)
  }
  
  // If we don't have hardcoded tests AND no database tests, show error
  if (!hasHardcodedTests && (!currentTestCases || currentTestCases.length === 0)) {
    return createNoTestCasesCode(activeMethodId)
  }

  // Clean and prepare user code
  const cleanedFileContent = cleanUserCode(fileContent)
  
  // Inject appropriate class definitions (use clean method ID)
  const codeWithClassDefinitions = injectClassDefinitions(cleanedFileContent, cleanMethodId)
  
  // Get test cases code (use clean method ID)
  const testCasesCode = getTestCasesCode(cleanMethodId, currentTestCases)
  
  // Generate helper methods (use clean method ID)
  const helperMethods = generateHelperMethods(cleanMethodId)
  
  // Add necessary imports for certain topics (use clean method ID)
  const imports = generateImports(cleanMethodId)
  
  return buildCompleteJavaCode(imports, codeWithClassDefinitions, helperMethods, testCasesCode)
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
    .replace(/import\s+java\.util\.\*;?/g, '') // Remove import statements (we'll add them back if needed)
    .replace(/import\s+java\.\w+(\.\w+)*;?/g, '') // Remove all Java imports
    .replace(/public\s+class\s+(\w+)/g, 'class $1') // Remove public from all classes
    .replace(/\/\/\s*Test method to demonstrate the solution[\s\S]*$/g, '') // Remove test methods and everything after
    .replace(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}/g, '') // Remove any existing main methods
    .replace(/\/\*\*[\s\S]*?\*\/\s*/g, '') // Remove class definition comments
    .trim() // Remove trailing whitespace
}

// Generate necessary imports based on method type
const generateImports = (activeMethodId: string): string => {
  if (supportedGraphAlgorithmMethods.includes(activeMethodId)) {
    return 'import java.util.*;\n'
  }
  return ''
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
const getTestCasesCode = (activeMethodId: string, currentTestCases?: any[]): string => {
  console.log("Looking for test cases for:", activeMethodId)
  
  // always check hardcoded test cases first
  if (linkedListTestCases[activeMethodId]) {
    console.log("✅ Found LinkedList test cases for:", activeMethodId)
    return linkedListTestCases[activeMethodId]
  } 
  
  if (binarySearchTreeTestCases[activeMethodId]) {
    console.log("✅ Found BST test cases for:", activeMethodId)
    return binarySearchTreeTestCases[activeMethodId]
  } 
  
  if (sortingTestCases[activeMethodId]) {
    console.log("✅ Found Sorting test cases for:", activeMethodId)
    return sortingTestCases[activeMethodId]
  } 
  
  if (hashTableTestCases[activeMethodId]) {
    console.log("✅ Found HashTable test cases for:", activeMethodId)
    return hashTableTestCases[activeMethodId]
  } 
  
  if (graphAlgorithmTestCases[activeMethodId]) {
    console.log("✅ Found Graph Algorithm test cases for:", activeMethodId)
    return graphAlgorithmTestCases[activeMethodId]
  }
  
  // Fallback
  console.log("❌ No test cases found at all for:", activeMethodId)
  return `
        System.out.println("Running test cases for ${activeMethodId} function:");
        System.out.println("==================================================");
        
        // Add your test cases here based on currentTestCases
        System.out.println("Test execution for " + "${activeMethodId}" + " not implemented yet.");`
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
  
  if (supportedHashTableMethods.includes(activeMethodId)) {
    helpers.push(`
    // Helper method to display hash table state
    public static void printHashTable(int[] table) {
        System.out.print("[");
        for (int i = 0; i < table.length; i++) {
            if (table[i] == -1) {
                System.out.print("_");
            } else if (table[i] == -2) {
                System.out.print("T");
            } else {
                System.out.print(table[i]);
            }
            if (i < table.length - 1) System.out.print(", ");
        }
        System.out.println("]");
    }`)
  }
  
  if (supportedGraphAlgorithmMethods.includes(activeMethodId)) {
    helpers.push(`
    // Helper method to print graph adjacency list
    public static void printAdjacencyList(LinkedList<Integer>[] adj) {
        for (int i = 0; i < adj.length; i++) {
            System.out.print(i + ": ");
            for (Integer neighbor : adj[i]) {
                System.out.print(neighbor + " ");
            }
            System.out.println();
        }
    }
    
    // Helper method to print path
    public static void printPath(int[] parent, int dest) {
        if (parent[dest] == -1) {
            System.out.print(dest);
            return;
        }
        printPath(parent, parent[dest]);
        System.out.print(" -> " + dest);
    }`)
  }
  
  return helpers.join('')
}

// Build the complete Java code
const buildCompleteJavaCode = (imports: string, codeWithClasses: string, helperMethods: string, testCasesCode: string): string => {
  return `${imports}
${codeWithClasses}

public class Main {
    ${helperMethods}
    
    public static void main(String[] args) {
        ${testCasesCode}
    }
}`
}