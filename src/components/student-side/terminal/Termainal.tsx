import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import usePythonRunner from '@/utils/PythonExecuter'

import { useFile } from '@/components/context/FileContext'

import { useToast } from '@/hooks/use-toast'

const Terminal = () => {
  const [output, setOutput] = useState('')
  const [compiler, setCompiler] = useState('')
  const { pyodide } = usePythonRunner()
  const { fileContent, isSaved, setErrorContent } = useFile()
  const { toast } = useToast()

  const handleRun = async () => {
    if (!isSaved()) {
      toast({
        title: 'Please save the file before running',
        variant: 'destructive',
      })
      return
    }
    if (compiler === 'python') {
      try {
        setOutput('')
        // Format the Python code with proper indentation
        const pythonCode = `
import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = StringIO()
try:
    ${fileContent.replace(/\n/g, '\n    ')}  # Indent the user's code
    output = sys.stdout.getvalue()
finally:
    sys.stdout = old_stdout
`.trimStart()

        console.log('Executing Python code:', pythonCode); // Debug log
        await pyodide?.runPython(pythonCode)

        // Get the captured output
        const output = await pyodide?.globals.get('output')
        setOutput(output || 'No output')
        setErrorContent('')
        toast({
          title: 'Success',
          description: 'Code executed successfully',
        })
      } catch (error: any) {
        console.log('Detailed error:', error)
        const errorMessage = error.toString()
        setOutput(error.toString())
        setErrorContent(errorMessage)
      }
    } else {
      toast({
        title: 'Please select a valid compiler',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center">
        <Button onClick={handleRun} className="m-2">
          Run
        </Button>
        <div className="m-2">
          <Select onValueChange={setCompiler}>
            <SelectTrigger>
              <SelectValue placeholder="Select Compiler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-full ml-2 mr-2 mb-2">
        <Textarea
          value={output}
          readOnly
          className="h-full w-full resize-none"
          placeholder="Output will be displayed here..."
        />
      </div>
    </div>
  )
}

export default Terminal
