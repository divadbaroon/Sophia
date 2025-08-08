'use client'

import { Judge0SubmissionResult, Judge0Config } from './types'

export class Judge0Service {
  private config: Judge0Config

  constructor() {
    this.config = {
      apiUrl: "https://judge0-ce.p.rapidapi.com",
      apiKey: process.env.NEXT_PUBLIC_JUDGE0_API_KEY || "",
      javaLanguageId: 62 // Java (OpenJDK 13.0.1)
    }
  }

  async executeCode(sourceCode: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("RapidAPI key not configured. Please check your environment variables.")
    }

    try {
      console.log("Submitting code to Judge0...")
      
      const submissionToken = await this.createSubmission(sourceCode)
      const result = await this.pollForResult(submissionToken)
      
      return this.formatResult(result)
    } catch (error) {
      console.error("Judge0 submission error:", error)
      throw error
    }
  }

  private async createSubmission(sourceCode: string): Promise<string> {
    const response = await fetch(`${this.config.apiUrl}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': this.config.apiKey,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: this.config.javaLanguageId,
        stdin: "",
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Create submission error:", errorText)
      throw new Error(`Failed to create submission: ${response.status} - ${errorText}`)
    }

    const { token } = await response.json()
    console.log("Submission created with token:", token)
    return token
  }

  private async pollForResult(token: string): Promise<Judge0SubmissionResult> {
    let attempts = 0
    const maxAttempts = 30
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const response = await fetch(`${this.config.apiUrl}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,status_id,compile_output,message`, {
        headers: {
          'x-rapidapi-key': this.config.apiKey,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Get result error:", errorText)
        throw new Error(`Failed to get submission result: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log(`Attempt ${attempts + 1}: Status ID ${result.status_id}`)
      
      // Status IDs 1-2 mean still processing
      if (result.status_id <= 2) {
        attempts++
        continue
      }
      
      return result
    }
    
    throw new Error("Execution timeout - submission took too long to complete")
  }

  private formatResult(result: Judge0SubmissionResult): string {
    const stdout = this.decodeBase64(result.stdout)
    const stderr = this.decodeBase64(result.stderr)
    const compileOutput = this.decodeBase64(result.compile_output)

    switch (result.status_id) {
      case 3: // Accepted
        return stdout || "No output"
      
      case 6: // Compilation Error
        const formattedError = compileOutput
          .replace(/Main\.java:/g, '')
          .replace(/error:/g, 'Error:')
          .trim()
        return `Compilation failed:\n${formattedError}\n\nPlease fix the compilation errors and try again.`
      
      case 5: // Time Limit Exceeded
        return `Time Limit Exceeded\n\nYour code took too long to execute. This might be due to:\n• Infinite loops\n• Very inefficient algorithms\n• Large input data\n\nPlease review your code and try again.`
      
      case 4: // Wrong Answer
        return stdout || "No output"
      
      case 7: // Memory Limit Exceeded
        return `Memory Limit Exceeded\n\nYour code used too much memory. This might be due to:\n• Creating too many objects\n• Large data structures\n• Memory leaks\n\nPlease optimize your code and try again.`
      
      case 8: // Output Limit Exceeded
        return `Output Limit Exceeded\n\nYour code produced too much output. This might be due to:\n• Infinite print loops\n• Printing large amounts of data\n\nPlease review your output statements and try again.`
      
      case 11: // Runtime Error (SIGSEGV)
        return `Runtime Error: Segmentation Fault\n\nYour code attempted to access invalid memory. This might be due to:\n• Null pointer access\n• Array index out of bounds\n• Stack overflow\n\nPlease review your code for potential null pointer issues.`
      
      case 12: // Runtime Error (SIGXFSZ)
        return `Runtime Error: File Size Limit Exceeded\n\nYour code tried to create files that are too large.\nPlease review your file operations.`
      
      default: // Other runtime errors
        let errorMsg = stderr || compileOutput || result.message || "Unknown error occurred"
        
        if (stderr) {
          errorMsg = stderr
            .replace(/Exception in thread "main"/g, 'Runtime Error')
            .replace(/\tat .*/g, '')
            .replace(/Main\.java:\d+/g, '')
            .trim()
        }
        
        return `Runtime Error:\n${errorMsg}\n\nPlease review your code and try again.`
    }
  }

  private decodeBase64(encoded?: string): string {
    if (!encoded) return ""
    
    try {
      return atob(encoded)
    } catch {
      return encoded
    }
  }
}