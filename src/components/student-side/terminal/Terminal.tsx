'use client'

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
import { useFile } from '@/lib/context/FileContext'
import { useToast } from '@/hooks/use-toast'

interface TestCase {
  nums: number[]
  target: number
  expected: number[]
}

const testCases: TestCase[] = [
  {
    nums: [2, 7, 11, 15],
    target: 9,
    expected: [0, 1]
  },
  {
    nums: [3, 2, 4],
    target: 6,
    expected: [1, 2]
  },
  {
    nums: [3, 3],
    target: 6,
    expected: [0, 1]
  }
];

const Terminal: React.FC = () => {
  const [output, setOutput] = useState('')
  const [compiler, setCompiler] = useState('python')
  const { pyodide } = usePythonRunner()
  const { fileContent, isSaved, setErrorContent } = useFile()
  const { toast } = useToast()

  const handleRun = async (): Promise<void> => {
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
        
        // First, execute the code to validate syntax
        const checkSyntaxCode = `
from typing import List

def check_code_syntax():
    try:
        # Execute the code to check for syntax errors
        exec("""${fileContent.replace(/"/g, '\\"')}""")
        return True, ""
    except Exception as e:
        return False, str(e)

syntax_valid, error_message = check_code_syntax()
`.trim();

        console.log('Checking code syntax...');
        await pyodide?.runPython(checkSyntaxCode);
        
        const syntaxValid = await pyodide?.globals.get('syntax_valid');
        const errorMessage = await pyodide?.globals.get('error_message');
        
        if (!syntaxValid) {
          setOutput(`Error: ${errorMessage}`);
          setErrorContent(`Error: ${errorMessage}`);
          toast({
            title: 'Syntax Error',
            description: 'Please fix the syntax errors in your code',
            variant: 'destructive',
          });
          return;
        }
        
        // If syntax is valid, run test cases
        const testRunnerCode = `
from typing import List
import sys
from io import StringIO

# First execute the user's code to define the Solution class
${fileContent}

# Define test cases
test_cases = ${JSON.stringify(testCases)}

# Capture output
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for twoSum function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    nums = test["nums"]
    target = test["target"]
    expected = test["expected"]
    
    solution = Solution()
    try:
        result = solution.twoSum(nums, target)
        # Sort both lists to handle different order
        result_sorted = sorted(result) if result else result
        expected_sorted = sorted(expected)
        
        if result_sorted == expected_sorted:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: nums = {nums}, target = {target}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: nums = {nums}, target = {target}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: nums = {nums}, target = {target}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`.trim();

        console.log('Running test cases...');
        await pyodide?.runPython(testRunnerCode);
        
        const testOutput = await pyodide?.globals.get('test_output');
        setOutput(testOutput || 'No output');
        setErrorContent('');
        
        // Check if all tests passed
        if (testOutput && testOutput.includes('All tests passed')) {
          toast({
            title: 'Success',
            description: 'All test cases passed! 🎉',
            variant: 'default',
          });
        } else if (testOutput) {
          toast({
            title: 'Some tests failed',
            description: 'Your solution works partially. Check the output for details.',
            variant: 'default',
          });
        }
      } catch (error: unknown) {
        console.log('Detailed error:', error);
        let errorMessage: string;
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = 'An unknown error occurred';
        }
        
        setOutput(errorMessage);
        setErrorContent(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to execute code',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Please select a valid compiler',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center">
        <Button onClick={handleRun} className="m-2">
          Run Tests
        </Button>
        <div className="m-2">
          <Select 
            defaultValue="python"
            onValueChange={setCompiler}
          >
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
          className="h-full w-full resize-none font-mono"
          placeholder="Output will be displayed here..."
        />
      </div>
    </div>
  );
};

export default Terminal;