'use client'

import { TestCaseResult } from "@/types"

import { ParsedTestResults } from "./types"

export const useTestResultParser = () => {
  const parseTestResults = (output: string, activeMethodId: string): ParsedTestResults => {
    // Check for error conditions first
    const isError = checkForErrors(output)
    
    if (isError) {
      return {
        passedCount: 0,
        totalCount: 0,
        detailedResults: [],
        isError: true,
        isSuccess: false
      }
    }

    // Parse success results
    const lines = output.split('\n')
    const { passedCount, totalCount } = parseTestSummary(lines)
    const detailedResults = parseDetailedTestResults(lines, activeMethodId)
    const isSuccess = output.includes("All tests passed")

    return {
      passedCount,
      totalCount,
      detailedResults,
      isError: false,
      isSuccess
    }
  }

  return { parseTestResults }
}

// Helper function to check for various error conditions
const checkForErrors = (output: string): boolean => {
  const errorIndicators = [
    "Compilation failed:",
    "Runtime Error:",
    "Time Limit Exceeded",
    "Memory Limit Exceeded",
    "Output Limit Exceeded"
  ]
  
  return errorIndicators.some(indicator => output.includes(indicator))
}

// Helper function to parse the test summary (e.g., "Results: 3/5 tests passed")
const parseTestSummary = (lines: string[]): { passedCount: number; totalCount: number } => {
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
  
  return { passedCount, totalCount }
}

// Helper function to parse detailed test case results
const parseDetailedTestResults = (lines: string[], activeMethodId: string): TestCaseResult[] => {
  const detailedResults: TestCaseResult[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    const testMatch = line.match(/Test (\d+):/)
    if (testMatch) {
      const testIndex = parseInt(testMatch[1]) - 1
      const testResult = parseIndividualTestResult(lines, i, testIndex, activeMethodId)
      
      if (testResult) {
        detailedResults.push(testResult)
      }
    }
  }
  
  return detailedResults
}

// Helper function to parse an individual test result
const parseIndividualTestResult = (
  lines: string[], 
  startIndex: number, 
  testIndex: number, 
  activeMethodId: string
): TestCaseResult | null => {
  let expectedOutput = ""
  let actualOutput = ""
  let isPassed = false
  
  // Look for test details in the next few lines
  for (let j = startIndex; j < Math.min(startIndex + 6, lines.length); j++) {
    const currentLine = lines[j]
    
    // Parse expected vs actual output
    if (currentLine.includes("Expected:") && currentLine.includes("Got:")) {
      const match = currentLine.match(/Expected: '([^']*)', Got: '([^']*)'/)
      if (match) {
        expectedOutput = match[1]
        actualOutput = match[2]
      }
    }
    
    // Check if test passed or failed
    if (currentLine.includes("PASSED")) {
      isPassed = true
    } else if (currentLine.includes("FAILED")) {
      isPassed = false
    }
  }
  
  // Only return if we have meaningful data
  if (expectedOutput !== "" || actualOutput !== "") {
    return {
      testCaseIndex: testIndex,
      testInput: { 
        methodCall: activeMethodId,
        testDescription: lines[startIndex].trim()
      },
      expectedOutput: expectedOutput,
      actualOutput: actualOutput, 
      passed: isPassed,
      errorMessage: isPassed ? undefined : "Test failed - output mismatch",
      executionTimeMs: 25 + Math.floor(Math.random() * 50) // Mock execution time
    }
  }
  
  return null
}