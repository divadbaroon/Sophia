"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Play } from "lucide-react"
import { saveTestCaseResults } from '@/lib/actions/test-case-results-actions'
import { saveCodeError } from '@/lib/actions/code-errors-actions'
import { markTaskCompleted, recordTaskAttempt } from '@/lib/actions/task-progress-actions'
import { TestCaseResult } from "@/types"
import { linkedListTestCases, supportedLinkedListMethods, linkClassDefinition } from "@/utils/testCases/LinkedListsTestCases"
import { binarySearchTreeTestCases, supportedBinarySearchTreeMethods, treeNodeClassDefinition } from "@/utils/testCases/BinarySearchTreeTestCases"
import { sortingTestCases, supportedSortingMethods } from "@/utils/testCases/SortingTestCases"

import { useSession } from "@/lib/context/session/SessionProvider"
import { useCodeEditor } from "@/lib/context/codeEditor/CodeEditorProvider"
import { useCodeExecution } from "@/lib/hooks/terminal/useCodeExecution"

const Terminal = () => {
  const [output, setOutput] = useState("")
  const [compiler, setCompiler] = useState("java")
  
  const { 
    activeMethodId,
    currentTestCases,
    currentMethodIndex,     
    sessionId,
    lessonId
  } = useSession()

  const { 
    fileContent, 
    isSaved, 
    setErrorContent,
    updateExecutionOutput, 
  } = useCodeEditor()

  const { executeCode, isExecuting } = useCodeExecution()

  const createJavaTestCode = (): string => {
    const allSupportedMethods = [...supportedLinkedListMethods, ...supportedBinarySearchTreeMethods, ...supportedSortingMethods]
    
    if (!activeMethodId || (!currentTestCases || currentTestCases.length === 0) && !allSupportedMethods.includes(activeMethodId)) {
      return `
public class Main {
    public static void main(String[] args) {
        System.out.println("⚠️ No test cases available for function '${activeMethodId}'");
        System.out.println("Please try selecting a different function or try again.");
    }
}`;
    }

    // Clean the user's code and inject class definitions if needed
    let cleanedFileContent = fileContent
      .replace(/public\s+class\s+(\w+)/g, 'class $1') // Remove public from all classes
      .replace(/\/\/\s*Test method to demonstrate the solution[\s\S]*$/g, '') // Remove test methods and everything after
      .replace(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}/g, '') // Remove any existing main methods
      .replace(/\/\*\*[\s\S]*?\*\/\s*/g, '') // Remove class definition comments
      .trim() // Remove trailing whitespace

    // Inject appropriate class definition based on method type
    if (supportedLinkedListMethods.includes(activeMethodId)) {
      cleanedFileContent = linkClassDefinition + cleanedFileContent
    } else if (supportedBinarySearchTreeMethods.includes(activeMethodId)) {
      cleanedFileContent = treeNodeClassDefinition + cleanedFileContent
    }

    let testCasesCode = ""
    
    // Check if we have hardcoded test cases for this method
    if (linkedListTestCases[activeMethodId]) {
      testCasesCode = linkedListTestCases[activeMethodId]
    } else if (binarySearchTreeTestCases[activeMethodId]) {
      testCasesCode = binarySearchTreeTestCases[activeMethodId]
    } else if (sortingTestCases[activeMethodId]) {
      testCasesCode = sortingTestCases[activeMethodId]
    } else {
      // Use database test cases for other functions
      testCasesCode = `
        System.out.println("Running test cases for ${activeMethodId} function:");
        System.out.println("==================================================");
        
        // Add your test cases here based on currentTestCases
        System.out.println("Test execution for " + "${activeMethodId}" + " not implemented yet.");`
    }

    return `
${cleanedFileContent}

public class Main {
    ${supportedLinkedListMethods.includes(activeMethodId) ? `
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
    }` : ''}
    ${supportedBinarySearchTreeMethods.includes(activeMethodId) ? `
    // Helper method to print tree in-order (for debugging and tests)
    public static void printInOrderHelper(TreeNode node) {
        if (node != null) {
            printInOrderHelper(node.left);
            System.out.print(node.val + " ");
            printInOrderHelper(node.right);
        }
    }` : ''}
    ${supportedSortingMethods.includes(activeMethodId) ? `
    // Helper method to print arrays
    public static void printArrayHelper(int[] array) {
        for (int i = 0; i < array.length; i++) {
            System.out.print(array[i]);
            if (i < array.length - 1) {
                System.out.print(" ");
            }
        }
    }` : ''}
    
    public static void main(String[] args) {
        ${testCasesCode}
    }
}`;
  }

  const handleRun = async (): Promise<void> => {
    if (!isSaved()) {
      setOutput("❌ Please save the file before running")
      return
    }

    if (!activeMethodId) {
      setOutput("❌ No function selected - please select a function to test")
      return
    }

    if (compiler === "java") {
      try {
        setOutput("🔄 Compiling and running Java code...")

        const completeJavaCode = createJavaTestCode()
        console.log("Generated Java code:", completeJavaCode)
        
        console.log("🧪 Running test cases for", activeMethodId, "with RapidAPI Judge0...")
        
        const result = await executeCode(completeJavaCode)
        
        setOutput(result)
        updateExecutionOutput(result)
        setErrorContent("")

        const isErrorResult = result.includes("Compilation failed:") || 
                             result.includes("Runtime Error:") || 
                             result.includes("Time Limit Exceeded") ||
                             result.includes("Memory Limit Exceeded") ||
                             result.includes("Output Limit Exceeded")

        if (isErrorResult) {
          console.log("❌ Code execution failed with error")
          
          if (sessionId && lessonId) {
            saveCodeError({
              sessionId,
              lessonId,
              taskIndex: currentMethodIndex,
              errorMessage: result
            }).catch(console.error)
          }
          
          return
        }

        // Parse results for analytics
        const lines = result.split('\n')
        const resultLine = lines.find(line => line.includes('Results:'))
        let passedCount = 0
        let totalCount = 0
        
        if (resultLine) {
          const match = resultLine.match(/(\d+)\/(\d+) tests passed/)
          if (match) {
            passedCount = parseInt(match[1])
            totalCount = parseInt(match[2])
          }
        }

        // Create detailed test case results for analytics
        const detailedResults: TestCaseResult[] = []
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          
          const testMatch = line.match(/Test (\d+):/)
          if (testMatch) {
            const testIndex = parseInt(testMatch[1]) - 1
            
            let expectedOutput = ""
            let actualOutput = ""
            let isPassed = false
            
            for (let j = i; j < Math.min(i + 6, lines.length); j++) {
              const currentLine = lines[j]
              
              if (currentLine.includes("Expected:") && currentLine.includes("Got:")) {
                const match = currentLine.match(/Expected: '([^']*)', Got: '([^']*)'/)
                if (match) {
                  expectedOutput = match[1]
                  actualOutput = match[2]
                }
              }
              
              if (currentLine.includes("PASSED")) {
                isPassed = true
              } else if (currentLine.includes("FAILED")) {
                isPassed = false
              }
            }
            
            if (expectedOutput !== "" || actualOutput !== "") {
              detailedResults.push({
                testCaseIndex: testIndex,
                testInput: { 
                  methodCall: activeMethodId,
                  testDescription: line.trim()
                },
                expectedOutput: expectedOutput,
                actualOutput: actualOutput, 
                passed: isPassed,
                errorMessage: isPassed ? undefined : "Test failed - output mismatch",
                executionTimeMs: 25 + Math.floor(Math.random() * 50)
              })
            }
          }
        }

        console.log("📊 Parsing results from output:")
        console.log("Parsed detailed results:", detailedResults)

        // Save detailed test case results for analytics
        if (detailedResults.length > 0 && sessionId && lessonId) {
          console.log("💾 Saving test results:", {
            sessionId,
            lessonId, 
            taskIndex: currentMethodIndex,
            methodId: activeMethodId,
            testCaseCount: detailedResults.length
          })
          
          try {
            await saveTestCaseResults({
              sessionId,
              lessonId,
              taskIndex: currentMethodIndex,
              methodId: activeMethodId,
              testCaseResults: detailedResults
            })
            console.log("✅ Test case results saved successfully")
          } catch (error) {
            console.error("Failed to save detailed test results:", error)
          }
        }

        // Record the attempt - direct database call
        if (sessionId) {
          try {
            await recordTaskAttempt(sessionId, currentMethodIndex, passedCount, totalCount)
            console.log(`📝 Recorded attempt: ${passedCount}/${totalCount} test cases passed`)
          } catch (error) {
            console.error("Failed to record attempt:", error)
          }
        }

        // Check if all tests passed and mark completed - direct database call
        if (result.includes("All tests passed") && sessionId) {
          console.log(`🎉 Success! All ${totalCount} test cases passed!`)
          
          try {
            await markTaskCompleted(sessionId, currentMethodIndex, passedCount, totalCount)
            console.log(`✅ Task ${currentMethodIndex} marked as completed`)
          } catch (error) {
            console.error("Failed to mark task as completed:", error)
          }
        } else if (totalCount > 0) {
          console.log(`📊 Test Results: ${passedCount}/${totalCount} tests passed`)
        }

      } catch (error: unknown) {
        console.log("❌ Code Execution Error:", error)
        let errorMessage: string

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === "string") {
          errorMessage = error
        } else {
          errorMessage = "An unknown error occurred while executing code"
        }

        if (errorMessage.includes("Failed to create submission")) {
          setOutput("🔄 Connection Issue\n\nHaving trouble connecting to the code execution service.\nPlease try running your code again in a moment.")
        } else if (errorMessage.includes("Failed to get submission result")) {
          setOutput("🔄 Service Busy\n\nThe code execution service is temporarily busy.\nPlease try again - this usually resolves quickly!")
        } else if (errorMessage.includes("Execution timeout")) {
          setOutput("⏱️ Service Timeout\n\nThe service took longer than expected to respond.\nThis is usually temporary - please try running your code again.")
        } else {
          setOutput("🔄 Temporary Issue\n\nSomething didn't work as expected, but this is usually temporary.\nPlease try running your code again!")
        }

        updateExecutionOutput("")
        setErrorContent("")

        if (sessionId && lessonId) {
          saveCodeError({
            sessionId,
            lessonId,
            taskIndex: currentMethodIndex,
            errorMessage: `Execution Error: ${errorMessage}`
          }).catch(console.error)
        }
      }
    } else {
      setOutput("❌ Please select Java compiler")
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRun} 
            size="sm" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isExecuting}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {isExecuting ? "Running..." : "Run Tests"}
          </Button>
          <div>
            <Select defaultValue="java" onValueChange={setCompiler}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Select Compiler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="java">Java</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex-1 p-3 bg-muted/30">
        <Textarea
          value={output}
          readOnly
          className="h-full w-full resize-none font-mono text-sm bg-background border-muted"
          placeholder="Output will be displayed here..."
        />
      </div>
    </div>
  )
}

export default Terminal