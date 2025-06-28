"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { Play } from "lucide-react"

import { saveTestCaseResults } from '@/lib/actions/test-case-results-actions'
import { saveCodeError } from '@/lib/actions/code-errors-actions'

import { useToast } from "@/lib/hooks/use-toast"

import usePythonRunner from "@/utils/PythonExecuter"

import { useFile } from "@/lib/context/FileContext"

import { TestCaseResult } from "@/types"

const Terminal = () => {
  const [output, setOutput] = useState("")
  const [compiler, setCompiler] = useState("python")
  const { pyodide } = usePythonRunner()
  const { 
    fileContent, 
    isSaved, 
    setErrorContent,
    activeMethodId,
    currentTestCases,
    currentMethodIndex,     
    markTaskCompleted,
    recordAttempt,
    sessionId,
    lessonId
  } = useFile()
  
  const { toast } = useToast()

  const getTestRunnerCode = (): string => {
    if (!activeMethodId || !currentTestCases || currentTestCases.length === 0) {
      return `
print("❌ No test cases available for function '${activeMethodId}'")
print("Please contact your instructor if you believe this is an error.")
test_output = "No test cases available"
all_passed = False
passed_count = 0
total_count = 0
detailed_results = []
`;
    }
    
    return `
import time
import json

# Execute the user's code to define the functions
${fileContent}

# Define test cases from database
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for ${activeMethodId} function:")
print("=" * 50)

all_passed = True
passed_count = 0
total_count = len(test_cases)
detailed_results = []

for i, test in enumerate(test_cases):
    test_input = test.get("input", {})
    expected = test.get("expected")
    
    start_time = time.time()
    error_message = None
    actual_result = None
    test_passed = False
    
    try:
        # Simple approach: use **kwargs to pass all inputs as keyword arguments
        actual_result = ${activeMethodId}(**test_input)
        
        # Check if result matches expected
        if isinstance(expected, float) and isinstance(actual_result, (int, float)):
            # Handle floating point comparison
            test_passed = abs(actual_result - expected) < 0.01
        else:
            test_passed = (actual_result == expected)
        
        if test_passed:
            passed_count += 1
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: {test_input}")
            print(f"   Expected: {expected}")
            print(f"   Result: {actual_result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: {test_input}")
            print(f"   Expected: {expected}")
            print(f"   Result: {actual_result}")
            
    except Exception as e:
        all_passed = False
        error_message = str(e)
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: {test_input}")
        print(f"   Error: {error_message}")
    
    # Calculate execution time
    execution_time_ms = int((time.time() - start_time) * 1000)
    
    # Store detailed result for tracking
    detailed_results.append({
        "testCaseIndex": i,
        "testInput": test_input,
        "expectedOutput": expected,
        "actualOutput": actual_result,
        "passed": test_passed,
        "errorMessage": error_message,
        "executionTimeMs": execution_time_ms
    })
        
    print()

print(f"Results: {passed_count}/{total_count} tests passed")
if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
  };

  const handleRun = async (): Promise<void> => {
    if (!isSaved()) {
      toast({
        title: "Please save the file before running",
        variant: "destructive",
      })
      return
    }

    if (!activeMethodId) {
      toast({
        title: "No function selected",
        description: "Please select a function to test",
        variant: "destructive",
      })
      return
    }

    if (!currentTestCases || currentTestCases.length === 0) {
      toast({
        title: "No test cases available",
        description: "Please contact your instructor if you believe this is an error",
        variant: "destructive",
      })
      return
    }

    if (compiler === "python") {
      try {
        setOutput("")

        // First, execute the code to validate syntax
        const checkSyntaxCode = `
def check_code_syntax():
    try:
        # Execute the code to check for syntax errors
        exec("""${fileContent.replace(/"/g, '\\"')}""")
        return True, ""
    except Exception as e:
        return False, str(e)

syntax_valid, error_message = check_code_syntax()
`.trim()

        console.log("Checking code syntax...")
        await pyodide?.runPython(checkSyntaxCode)

        const syntaxValid = await pyodide?.globals.get("syntax_valid")
        const errorMessage = await pyodide?.globals.get("error_message")

        if (!syntaxValid) {
          // Save syntax error for tracking
          saveCodeError({
            sessionId: sessionId || "unknown-session",
            lessonId: lessonId || "unknown-lesson",
            taskIndex: currentMethodIndex,
            errorMessage: `Syntax Error: ${errorMessage}`
          }).catch(console.error)

          setOutput(`Error: ${errorMessage}`)
          setErrorContent(`Error: ${errorMessage}`)
          toast({
            title: "Syntax Error",
            description: "Please fix the syntax errors in your code",
            variant: "destructive",
          })
          return
        }

        // If syntax is valid, run test cases
        const testRunnerCode = getTestRunnerCode();
        
        console.log(`Running test cases for ${activeMethodId}...`)
        await pyodide?.runPython(testRunnerCode)

        const testOutput = await pyodide?.globals.get("test_output")
        const allPassed = await pyodide?.globals.get("all_passed")
        const passedCountRaw = await pyodide?.globals.get("passed_count")
        const totalCountRaw = await pyodide?.globals.get("total_count")
        const detailedResultsRaw = await pyodide?.globals.get("detailed_results")
        
        // Convert Pyodide objects to JavaScript
        const passedCount = Number(passedCountRaw) || 0
        const totalCount = Number(totalCountRaw) || currentTestCases.length
        
        // Safely convert detailed results
        let detailedResults: any[] = []
        if (detailedResultsRaw) {
          try {
            // Check if it's a PyodideObject with toJs method
            if (typeof detailedResultsRaw === 'object' && detailedResultsRaw !== null && 'toJs' in detailedResultsRaw) {
              detailedResults = JSON.parse(JSON.stringify((detailedResultsRaw as any).toJs()))
            } else if (typeof detailedResultsRaw === 'string') {
              // If it's already a string, parse it
              detailedResults = JSON.parse(detailedResultsRaw)
            } else {
              // Try direct conversion
              detailedResults = JSON.parse(JSON.stringify(detailedResultsRaw))
            }
          } catch (error) {
            console.error("Failed to convert detailed results:", error)
            detailedResults = []
          }
        }

        setOutput(testOutput || "No output")
        setErrorContent("")

        // Save detailed test case results for analytics (non-blocking)
        if (detailedResults && detailedResults.length > 0) {
          console.log("Saving test results:", {
            sessionId: sessionId || "unknown-session",
            lessonId: lessonId || "unknown-lesson", 
            taskIndex: currentMethodIndex,
            methodId: activeMethodId,
            testCaseCount: detailedResults.length
          })
          
          saveTestCaseResults({
            sessionId: sessionId || "unknown-session",
            lessonId: lessonId || "unknown-lesson",
            taskIndex: currentMethodIndex,
            methodId: activeMethodId,
            testCaseResults: detailedResults as TestCaseResult[]
          }).catch(error => {
            console.error("Failed to save detailed test results:", error)
            // Don't block the UI if analytics saving fails
          })
        } else {
          console.log("No detailed results to save - either no tests ran or conversion failed")
        }

        // Record the attempt in the database with test case results
        try {
          await recordAttempt(currentMethodIndex, passedCount, totalCount)
          console.log(`📝 Recorded attempt: ${passedCount}/${totalCount} test cases passed`)
        } catch (error) {
          console.error("Failed to record attempt:", error)
        }

        // Check if all tests passed
        if (allPassed && testOutput && testOutput.includes("All tests passed")) {
          // Mark the current task as completed with test case data
          try {
            await markTaskCompleted(currentMethodIndex, passedCount, totalCount)
            console.log(`✅ Task ${currentMethodIndex} marked as completed`)
          } catch (error) {
            console.error("Failed to mark task as completed:", error)
          }
          
          toast({
            title: "Success! 🎉",
            description: `All ${totalCount} test cases passed!`,
            variant: "default",
          })
        } else if (testOutput) {
          toast({
            title: `${passedCount}/${totalCount} tests passed`,
            description: "Your solution works partially. Check the output for details.",
            variant: "default",
          })
        }
      } catch (error: unknown) {
        console.log("Detailed error:", error)
        let errorMessage: string

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === "string") {
          errorMessage = error
        } else {
          errorMessage = "An unknown error occurred"
        }

        // Save runtime error for tracking
        saveCodeError({
          sessionId: sessionId || "unknown-session",
          lessonId: lessonId || "unknown-lesson",
          taskIndex: currentMethodIndex,
          errorMessage: `Runtime Error: ${errorMessage}`
        }).catch(console.error)

        setOutput(errorMessage)
        setErrorContent(errorMessage)
        toast({
          title: "Error",
          description: "Failed to execute code",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Please select a valid compiler",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Button onClick={handleRun} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Tests
          </Button>
          <div>
            <Select defaultValue="python" onValueChange={setCompiler}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Select Compiler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
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