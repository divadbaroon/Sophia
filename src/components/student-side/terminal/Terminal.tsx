"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Play } from "lucide-react"
import { saveTestCaseResults } from '@/lib/actions/test-case-results-actions'
import { saveCodeError } from '@/lib/actions/code-errors-actions'
import { markTaskCompleted, recordTaskAttempt } from '@/lib/actions/task-progress-actions'

import { useSession } from "@/lib/context/session/SessionProvider"
import { useCodeEditor } from "@/lib/context/codeEditor/CodeEditorProvider"
import { useCodeExecution } from "@/lib/hooks/terminal/useCodeExecution"
import { useTestResultParser } from "@/lib/hooks/terminal/useTestResultParser"
import { createJavaTestCode } from "@/utils/code-generation/javaTestCodeGenerator"

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
  const { parseTestResults } = useTestResultParser()

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

        const completeJavaCode = createJavaTestCode({
          fileContent,
          activeMethodId,
          currentTestCases
        })
        
        console.log("Generated Java code:", completeJavaCode)
        console.log("🧪 Running test cases for", activeMethodId, "with RapidAPI Judge0...")
        
        const result = await executeCode(completeJavaCode)
        
        setOutput(result)
        updateExecutionOutput(result)
        setErrorContent("")

        // Use the parser hook to analyze results
        const { passedCount, totalCount, detailedResults, isError, isSuccess } = parseTestResults(result, activeMethodId)

        if (isError) {
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
            saveTestCaseResults({
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

        // Record the attempt 
        if (sessionId) {
          try {
            recordTaskAttempt(sessionId, currentMethodIndex, passedCount, totalCount)
            console.log(`📝 Recorded attempt: ${passedCount}/${totalCount} test cases passed`)
          } catch (error) {
            console.error("Failed to record attempt:", error)
          }
        }

        // Check if all tests passed and mark completed 
        if (isSuccess && sessionId) {
          console.log(`🎉 Success! All ${totalCount} test cases passed!`)
          
          try {
            markTaskCompleted(sessionId, currentMethodIndex, passedCount, totalCount)
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