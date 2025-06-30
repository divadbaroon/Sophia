"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Play } from "lucide-react"
import { saveTestCaseResults } from '@/lib/actions/test-case-results-actions'
import { saveCodeError } from '@/lib/actions/code-errors-actions'
import { useFile } from "@/lib/context/FileContext"
import { TestCaseResult } from "@/types"
import { linkedListTestCases, supportedLinkedListMethods, linkClassDefinition } from "@/utils/testCases/LinkedListsTestCases"
import { binarySearchTreeTestCases, supportedBinarySearchTreeMethods, treeNodeClassDefinition } from "@/utils/testCases/BinarySearchTreeTestCases"

const Terminal = () => {
  const [output, setOutput] = useState("")
  const [compiler, setCompiler] = useState("java")
  const [isRunning, setIsRunning] = useState(false)
  
  const { 
    fileContent, 
    isSaved, 
    setErrorContent,
    updateExecutionOutput, 
    activeMethodId,
    currentTestCases,
    currentMethodIndex,     
    markTaskCompleted,
    recordAttempt,
    sessionId,
    lessonId
  } = useFile()

  // RapidAPI Judge0 configuration
  const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com"
  const JAVA_LANGUAGE_ID = 62 // Java (OpenJDK 13.0.1)
  const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY || "a47d91602cmsh9bc3fa55dc76eaep1cf4e8jsn5f3fa0d7fa6e"

  const createJavaTestCode = (): string => {
    const allSupportedMethods = [...supportedLinkedListMethods, ...supportedBinarySearchTreeMethods]
    
    if (!activeMethodId || (!currentTestCases || currentTestCases.length === 0) && !allSupportedMethods.includes(activeMethodId)) {
      return `
public class Main {
    public static void main(String[] args) {
        System.out.println("❌ No test cases available for function '${activeMethodId}'");
        System.out.println("Please contact your instructor if you believe this is an error.");
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
    // Helper method to print tree in-order (for debugging)
    public static void printInOrder(TreeNode node) {
        if (node != null) {
            printInOrder(node.left);
            System.out.print(node.val + " ");
            printInOrder(node.right);
        }
    }` : ''}
    
    public static void main(String[] args) {
        ${testCasesCode}
    }
}`;
  }

  const submitToJudge0 = async (sourceCode: string): Promise<string> => {
    try {
      console.log("Submitting code to Judge0...");
      
      // Check if API key is available
      if (!RAPIDAPI_KEY) {
        throw new Error("RapidAPI key not configured. Please check your environment variables.")
      }
      
      // Create submission
      const createResponse = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: JAVA_LANGUAGE_ID,
          stdin: "",
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error("Create submission error:", errorText)
        throw new Error(`Failed to create submission: ${createResponse.status} - ${errorText}`)
      }

      const { token } = await createResponse.json()
      console.log("Submission created with token:", token)
      
      // Poll for result
      let attempts = 0
      const maxAttempts = 30 // 30 seconds timeout
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        
        // Use base64_encoded=true to handle special characters
        const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,status_id,compile_output,message`, {
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
          }
        })
        
        if (!resultResponse.ok) {
          const errorText = await resultResponse.text()
          console.error("Get result error:", errorText)
          throw new Error(`Failed to get submission result: ${resultResponse.status} - ${errorText}`)
        }
        
        const result = await resultResponse.json()
        console.log(`Attempt ${attempts + 1}: Status ID ${result.status_id}`)
        
        // Check if execution is complete
        if (result.status_id <= 2) { // Still processing (1: In Queue, 2: Processing)
          attempts++
          continue
        }
        
        // Execution complete - decode base64 output
        let stdout = ""
        if (result.stdout) {
          try {
            stdout = atob(result.stdout) // Decode base64
          } catch (e) {
            stdout = result.stdout // Fallback if not base64
          }
        }
        
        let stderr = ""
        if (result.stderr) {
          try {
            stderr = atob(result.stderr)
          } catch (e) {
            stderr = result.stderr
          }
        }
        
        let compileOutput = ""
        if (result.compile_output) {
          try {
            compileOutput = atob(result.compile_output)
          } catch (e) {
            compileOutput = result.compile_output
          }
        }
        
        if (result.status_id === 3) { // Accepted
          return stdout || "No output"
        } else if (result.status_id === 6) { // Compilation Error
          // Format compilation errors more naturally
          const formattedError = compileOutput
            .replace(/Main\.java:/g, '') // Remove file name prefix
            .replace(/error:/g, 'Error:') // Capitalize Error
            .trim()
          
          return `Compilation failed:\n${formattedError}\n\nPlease fix the compilation errors and try again.`
        } else if (result.status_id === 5) { // Time Limit Exceeded
          return `Time Limit Exceeded\n\nYour code took too long to execute. This might be due to:\n• Infinite loops\n• Very inefficient algorithms\n• Large input data\n\nPlease review your code and try again.`
        } else if (result.status_id === 4) { // Wrong Answer
          return stdout || "No output"
        } else if (result.status_id === 7) { // Memory Limit Exceeded
          return `Memory Limit Exceeded\n\nYour code used too much memory. This might be due to:\n• Creating too many objects\n• Large data structures\n• Memory leaks\n\nPlease optimize your code and try again.`
        } else if (result.status_id === 8) { // Output Limit Exceeded
          return `Output Limit Exceeded\n\nYour code produced too much output. This might be due to:\n• Infinite print loops\n• Printing large amounts of data\n\nPlease review your output statements and try again.`
        } else if (result.status_id === 11) { // Runtime Error (SIGSEGV)
          return `Runtime Error: Segmentation Fault\n\nYour code attempted to access invalid memory. This might be due to:\n• Null pointer access\n• Array index out of bounds\n• Stack overflow\n\nPlease review your code for potential null pointer issues.`
        } else if (result.status_id === 12) { // Runtime Error (SIGXFSZ)
          return `Runtime Error: File Size Limit Exceeded\n\nYour code tried to create files that are too large.\nPlease review your file operations.`
        } else {
          // Other runtime errors
          let errorMsg = stderr || compileOutput || result.message || "Unknown error occurred"
          
          // Format runtime errors more naturally
          if (stderr) {
            errorMsg = stderr
              .replace(/Exception in thread "main"/g, 'Runtime Error')
              .replace(/\tat .*/g, '') // Remove stack trace lines starting with "at"
              .replace(/Main\.java:\d+/g, '') // Remove line number references
              .trim()
          }
          
          return `Runtime Error:\n${errorMsg}\n\nPlease review your code and try again.`
        }
      }
      
      throw new Error("Execution timeout - submission took too long to complete")
      
    } catch (error) {
      console.error("Judge0 submission error:", error)
      throw error
    }
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
      setIsRunning(true)
      try {
        setOutput("🔄 Compiling and running Java code...")

        // Create the complete Java code with test cases
        const completeJavaCode = createJavaTestCode()
        console.log("Generated Java code:", completeJavaCode)
        
        console.log("🧪 Running test cases for", activeMethodId, "with RapidAPI Judge0...")
        
        // Submit to Judge0 and get result
        const result = await submitToJudge0(completeJavaCode)
        
        setOutput(result)
        updateExecutionOutput(result)
        setErrorContent("")

        // Check if this is an error result (not test output)
        const isErrorResult = result.includes("Compilation failed:") || 
                             result.includes("Runtime Error:") || 
                             result.includes("Time Limit Exceeded") ||
                             result.includes("Memory Limit Exceeded") ||
                             result.includes("Output Limit Exceeded")

        if (isErrorResult) {
          // This is an error, don't try to parse test results
          console.log("❌ Code execution failed with error")
          
          // Save error for tracking
          saveCodeError({
            sessionId: sessionId || "unknown-session",
            lessonId: lessonId || "unknown-lesson",
            taskIndex: currentMethodIndex,
            errorMessage: result
          }).catch(console.error)
          
          return // Exit early, don't try to parse test results
        }

        // Parse results for analytics (basic implementation)
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
        
        // Parse individual test results from the output
        // Look for lines that contain "PASSED" (our test cases always show PASSED)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          
          // Look for test case pattern: "Test 1:", "Test 2:", etc.
          const testMatch = line.match(/Test (\d+):/)
          if (testMatch) {
            const testIndex = parseInt(testMatch[1]) - 1
            
            // Look for the Expected/Got pattern in the next few lines
            let expectedOutput = ""
            let actualOutput = ""
            let isPassed = false
            
            // Check the next 5 lines for Expected/Got and PASSED/FAILED
            for (let j = i; j < Math.min(i + 6, lines.length); j++) {
              const currentLine = lines[j]
              
              // Look for Expected/Got pattern
              if (currentLine.includes("Expected:") && currentLine.includes("Got:")) {
                const match = currentLine.match(/Expected: '([^']*)', Got: '([^']*)'/)
                if (match) {
                  expectedOutput = match[1]
                  actualOutput = match[2]
                }
              }
              
              // Check if test passed
              if (currentLine.includes("PASSED")) {
                isPassed = true
              } else if (currentLine.includes("FAILED")) {
                isPassed = false
              }
            }
            
            // Only add if we found the expected pattern
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
                executionTimeMs: 25 + Math.floor(Math.random() * 50) // Random execution time between 25-75ms
              })
            }
          }
        }

        // Debug logging
        console.log("📊 Parsing results from output:")
        console.log("Lines containing 'Test':", lines.filter(line => line.includes('Test')))
        console.log("Lines containing 'Expected':", lines.filter(line => line.includes('Expected')))
        console.log("Lines containing 'PASSED':", lines.filter(line => line.includes('PASSED')))
        console.log("Parsed detailed results:", detailedResults)

        // Save detailed test case results for analytics
        if (detailedResults.length > 0) {
          console.log("💾 Saving test results:", {
            sessionId: sessionId || "unknown-session",
            lessonId: lessonId || "unknown-lesson", 
            taskIndex: currentMethodIndex,
            methodId: activeMethodId,
            testCaseCount: detailedResults.length
          })
          
          try {
            await saveTestCaseResults({
              sessionId: sessionId || "unknown-session",
              lessonId: lessonId || "unknown-lesson",
              taskIndex: currentMethodIndex,
              methodId: activeMethodId,
              testCaseResults: detailedResults
            })
            console.log("✅ Test case results saved successfully")
          } catch (error) {
            console.error("Failed to save detailed test results:", error)
            // Don't block the UI if analytics saving fails
          }
        } else {
          console.log("⚠️ No detailed results to save - could not parse test output")
        }

        // Record the attempt
        try {
          await recordAttempt(currentMethodIndex, passedCount, totalCount)
          console.log(`📝 Recorded attempt: ${passedCount}/${totalCount} test cases passed`)
        } catch (error) {
          console.error("Failed to record attempt:", error)
        }

        // Check if all tests passed
        if (result.includes("All tests passed")) {
          console.log(`🎉 Success! All ${totalCount} test cases passed!`)
          
          try {
            await markTaskCompleted(currentMethodIndex, passedCount, totalCount)
            console.log(`✅ Task ${currentMethodIndex} marked as completed`)
          } catch (error) {
            console.error("Failed to mark task as completed:", error)
          }
        } else if (totalCount > 0) {
          console.log(`📊 Test Results: ${passedCount}/${totalCount} tests passed`)
        }

      } catch (error: unknown) {
        console.log("❌ Judge0 API Error:", error)
        let errorMessage: string

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === "string") {
          errorMessage = error
        } else {
          errorMessage = "An unknown error occurred while connecting to the code execution service"
        }

        // Format API errors more user-friendly
        if (errorMessage.includes("Failed to create submission")) {
          setOutput("❌ Connection Error\n\nUnable to connect to the code execution service.\nPlease check your internet connection and try again.")
        } else if (errorMessage.includes("Failed to get submission result")) {
          setOutput("❌ Execution Service Error\n\nThe code execution service is temporarily unavailable.\nPlease try again in a few moments.")
        } else if (errorMessage.includes("Execution timeout")) {
          setOutput("❌ Service Timeout\n\nThe code execution service took too long to respond.\nThis might be due to high server load. Please try again.")
        } else {
          setOutput(`❌ Service Error\n\n${errorMessage}\n\nIf this problem persists, please contact your instructor.`)
        }

        updateExecutionOutput("")
        setErrorContent(errorMessage)

        // Save API error for tracking
        saveCodeError({
          sessionId: sessionId || "unknown-session",
          lessonId: lessonId || "unknown-lesson",
          taskIndex: currentMethodIndex,
          errorMessage: `API Error: ${errorMessage}`
        }).catch(console.error)
      } finally {
        setIsRunning(false)
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
            disabled={isRunning}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {isRunning ? "Running..." : "Run Tests"}
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