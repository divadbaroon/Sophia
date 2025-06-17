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
    currentTestCases
  } = useFile()
  
  const { toast } = useToast()

  const getFullCodeWithTests = (): string => {
    // Exit early if activeMethodId is not available
    if (!activeMethodId) return fileContent;
    
    // Add test code directly (no class wrapper)
    return `${fileContent}

# Test code
if __name__ == "__main__":
    # Test the current function
    if "${activeMethodId}" == "calculate_sum":
        result = calculate_sum(1, 6)
        print(f"calculate_sum result: {result}")
    elif "${activeMethodId}" == "create_pattern":
        result = create_pattern([7, 12, 9, 14, 6, 3])
        print(f"create_pattern result: {result}")
    elif "${activeMethodId}" == "create_multiplier":
        multiplier = create_multiplier(8)
        print(f"multiplier(6) = {multiplier(6)}")
    elif "${activeMethodId}" == "create_calculator":
        calculator = create_calculator("add")
        print(f"calculator(10, 5) = {calculator(10, 5)}")
    elif "${activeMethodId}" == "create_triple_operator":
        triple_op = create_triple_operator("sum")
        print(f"triple_op(5, 10, 3) = {triple_op(5, 10, 3)}")
    elif "${activeMethodId}" == "filter_high_scores":
        result = filter_high_scores({'Alice': 92, 'Bob': 75, 'Charlie': 85, 'David': 70}, 80)
        print(f"filter_high_scores result: {result}")
    elif "${activeMethodId}" == "slice_string":
        result = slice_string("Python Programming", 2, -2, 2)
        print(f"slice_string result: {result}")
    elif "${activeMethodId}" == "flatten_matrix":
        result = flatten_matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        print(f"flatten_matrix result: {result}")`;
  };

  const getTestRunnerCode = (): string => {
    // Exit early if activeMethodId or testCases are not available
    if (!activeMethodId || !currentTestCases) return "";
    
    const fullCodeWithTests = getFullCodeWithTests();
    
    // Generate different test runners based on the method
    if (activeMethodId === "calculate_sum") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for calculate_sum function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    start = test["input"]["start"]
    end = test["input"]["end"]
    expected = test["expected"]
    
    try:
        result = calculate_sum(start, end)
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: start = {start}, end = {end}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: start = {start}, end = {end}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: start = {start}, end = {end}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    } else if (activeMethodId === "create_pattern") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for create_pattern function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    numbers = test["input"]["numbers"]
    expected = test["expected"]
    
    try:
        result = create_pattern(numbers.copy())  # Pass a copy to prevent modification
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: numbers = {numbers}")
            print(f"   Expected: '{expected}'")
            print(f"   Result: '{result}'")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: numbers = {numbers}")
            print(f"   Expected: '{expected}'")
            print(f"   Result: '{result}'")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: numbers = {numbers}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    } else if (activeMethodId === "create_multiplier") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
import inspect
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for create_multiplier function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    factor = test["input"]["factor"]
    test_value = test["input"]["test_value"]
    expected = test["expected"]
    
    try:
        multiplier = create_multiplier(factor)
        
        # Check if it's a lambda function
        is_lambda = multiplier.__name__ == '<lambda>'
        if not is_lambda:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Not a lambda function. You returned: {multiplier}")
            continue
            
        # Test the multiplier
        result = multiplier(test_value)
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: factor = {factor}, test_value = {test_value}")
            print(f"   Expected: multiplier({test_value}) = {expected}")
            print(f"   Result: multiplier({test_value}) = {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: factor = {factor}, test_value = {test_value}")
            print(f"   Expected: multiplier({test_value}) = {expected}")
            print(f"   Result: multiplier({test_value}) = {result}")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: factor = {factor}, test_value = {test_value}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    } else if (activeMethodId === "create_calculator") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for create_calculator function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    operation = test["input"]["operation"]
    x = test["input"]["x"]
    y = test["input"]["y"]
    expected = test["expected"]
    
    try:
        calculator = create_calculator(operation)
        
        # Check if it's a lambda function
        is_lambda = calculator.__name__ == '<lambda>'
        if not is_lambda:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Not a lambda function. You returned: {calculator}")
            continue
            
        # Test the calculator
        result = calculator(x, y)
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: operation = '{operation}', x = {x}, y = {y}")
            print(f"   Expected: calculator({x}, {y}) = {expected}")
            print(f"   Result: calculator({x}, {y}) = {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: operation = '{operation}', x = {x}, y = {y}")
            print(f"   Expected: calculator({x}, {y}) = {expected}")
            print(f"   Result: calculator({x}, {y}) = {result}")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: operation = '{operation}', x = {x}, y = {y}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    } else if (activeMethodId === "create_triple_operator") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for create_triple_operator function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    operation = test["input"]["operation"]
    a = test["input"]["a"]
    b = test["input"]["b"]
    c = test["input"]["c"]
    expected = test["expected"]
    
    try:
        triple_op = create_triple_operator(operation)
        
        # Check if it's a lambda function
        is_lambda = triple_op.__name__ == '<lambda>'
        if not is_lambda:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Not a lambda function. You returned: {triple_op}")
            continue
            
        # Test the triple operator
        result = triple_op(a, b, c)
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: operation = '{operation}', a = {a}, b = {b}, c = {c}")
            print(f"   Expected: triple_op({a}, {b}, {c}) = {expected}")
            print(f"   Result: triple_op({a}, {b}, {c}) = {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: operation = '{operation}', a = {a}, b = {b}, c = {c}")
            print(f"   Expected: triple_op({a}, {b}, {c}) = {expected}")
            print(f"   Result: triple_op({a}, {b}, {c}) = {result}")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: operation = '{operation}', a = {a}, b = {b}, c = {c}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    } else if (activeMethodId === "filter_high_scores") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for filter_high_scores function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    scores = test["input"]["scores"]
    threshold = test["input"]["threshold"]
    expected = test["expected"]
    
    try:
        # Create a copy of scores to ensure original isn't modified
        result = filter_high_scores(dict(scores), threshold)
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: scores = {scores}, threshold = {threshold}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: scores = {scores}, threshold = {threshold}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: scores = {scores}, threshold = {threshold}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    } else if (activeMethodId === "slice_string") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for slice_string function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    text = test["input"]["text"]
    start = test["input"]["start"]
    end = test["input"]["end"]
    step = test["input"]["step"]
    expected = test["expected"]
    
    try:
        result = slice_string(text, start, end, step)
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: text = '{text}', start = {start}, end = {end}, step = {step}")
            print(f"   Expected: '{expected}'")
            print(f"   Result: '{result}'")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: text = '{text}', start = {start}, end = {end}, step = {step}")
            print(f"   Expected: '{expected}'")
            print(f"   Result: '{result}'")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: text = '{text}', start = {start}, end = {end}, step = {step}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    } else if (activeMethodId === "flatten_matrix") {
      return `
# First execute the user's code to define the functions
${fullCodeWithTests}

# Define test cases
test_cases = ${JSON.stringify(currentTestCases)}

# Capture output
import sys
from io import StringIO
output_buffer = StringIO()
sys.stdout = output_buffer

print("Running test cases for flatten_matrix function:")
print("=====================================")

all_passed = True
for i, test in enumerate(test_cases):
    matrix = test["input"]["matrix"]
    expected = test["expected"]
    
    try:
        # Make a deep copy of the matrix to ensure original isn't modified
        import copy
        matrix_copy = copy.deepcopy(matrix)
        result = flatten_matrix(matrix_copy)
        
        if result == expected:
            print(f"✅ Test {i+1} PASSED")
            print(f"   Input: matrix = {matrix}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
        else:
            all_passed = False
            print(f"❌ Test {i+1} FAILED")
            print(f"   Input: matrix = {matrix}")
            print(f"   Expected: {expected}")
            print(f"   Result: {result}")
    except Exception as e:
        all_passed = False
        print(f"❌ Test {i+1} ERROR")
        print(f"   Input: matrix = {matrix}")
        print(f"   Error: {str(e)}")
        
    print()

if all_passed:
    print("🎉 All tests passed! Your solution works for all test cases.")
else:
    print("Some tests failed. Review your solution and try again.")

# Restore stdout and get output
sys.stdout = sys.__stdout__
test_output = output_buffer.getvalue()
`;
    }
    
    // Default case - should not happen
    return "";
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
        
        if (!testRunnerCode) {
          setOutput(`Error: No test cases available for function '${activeMethodId}'`)
          return;
        }

        console.log(`Running test cases for ${activeMethodId}...`)
        await pyodide?.runPython(testRunnerCode)

        const testOutput = await pyodide?.globals.get("test_output")
        setOutput(testOutput || "No output")
        setErrorContent("")

        // Check if all tests passed
        if (testOutput && testOutput.includes("All tests passed")) {
          toast({
            title: "Success",
            description: "All test cases passed! 🎉",
            variant: "default",
          })
        } else if (testOutput) {
          toast({
            title: "Some tests failed",
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