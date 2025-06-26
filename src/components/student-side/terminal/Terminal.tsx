"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import usePythonRunner from "@/utils/PythonExecuter"
import { useFile } from "@/lib/context/FileContext"
import { useToast } from "@/hooks/use-toast"
import { Play } from "lucide-react"

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
    recordAttempt
  } = useFile()
  
  const { toast } = useToast()

  const getTestRunnerCode = (): string => {
    // Exit early if activeMethodId or testCases are not available
    if (!activeMethodId || !currentTestCases || currentTestCases.length === 0) {
      return `
print("❌ No test cases available for function '${activeMethodId}'")
print("Please contact your instructor if you believe this is an error.")
test_output = "No test cases available"
all_passed = False
passed_count = 0
total_count = 0
`;
    }
    
    // Generate simple, reliable test runner
    return `
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

for i, test in enumerate(test_cases):
    test_input = test.get("input", {})
    expected = test.get("expected")
    
    try:
        # Simple approach: use **kwargs to pass all inputs as keyword arguments
        result = ${activeMethodId}(**test_input)
        
        # Check if result matches expected
        if isinstance(expected, float) and isinstance(result, (int, float)):
            # Handle floating point comparison
            success = abs(result - expected) < 0.01
        else:
            success = (result == expected)
        
        if success:
            passed_count += 1
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: {test_input}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: {test_input}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
            
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: {test_input}")
        print(f"   Error: {str(e)}")
        
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
        
        // Convert Pyodide objects to JavaScript numbers
        const passedCount = Number(passedCountRaw) || 0
        const totalCount = Number(totalCountRaw) || currentTestCases.length

        setOutput(testOutput || "No output")
        setErrorContent("")

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