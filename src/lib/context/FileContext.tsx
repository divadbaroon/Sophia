import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { FileSystemNode } from '@/utils/FileUtils'
import { FileContextType, TestCase, TaskData, ConversationMessage } from '@/types'
import { usePathname } from 'next/navigation'

// Define the session data structure with tasks, method templates, and test cases
const condition1: TaskData = {
  tasks: [
    {
      title: "1.) calculate_sum()",
      difficulty: "Easy",
      description: "Implement a function that calculates the sum of a range of numbers. Use a for loop to iterate through the range and accumulate the total.",
      examples: [
        {
          input: { start: 1, end: 6 },
          output: '15'
        },
        {
          input: { start: 5, end: 10 },
          output: '35',
        },
        {
          input: { start: 1, end: 1 },
          output: '0',
        },
      ],
      constraints: [
        "Use a for loop with the range function",
        "The end parameter is exclusive (like Python's range)",
        "Return the sum as an integer"
      ]
    },
    {
      title: "2.) create_pattern()",
      difficulty: "Medium",
      description: "Implement a function that processes a list of numbers and creates a pattern string. For each number in the list: if divisible by 3, add 'X' to the result string; if divisible by 2, add 'O' to the result string; otherwise, add the number itself as a string.",
      examples: [
        {
          input: { numbers: [7, 12, 9, 14, 6, 3] },
          output: '"7OXO6X"'
        },
        {
          input: { numbers: [1, 2, 3, 4, 5, 6] },
          output: '"1OX4OX"',
        },
        {
          input: { numbers: [3, 6, 9, 12, 15, 18] },
          output: '"XXXXXX"',
        },
      ],
      constraints: [
        "Check divisibility by 3 first, then by 2",
        "Convert non-matching numbers to string before adding to result",
        "Return the final pattern as a string"
      ]
    },
    {
      title: "3.) create_multiplier()",
      difficulty: "Medium",
      description: "Create a function that generates a multiplier lambda function. The function should return a lambda that multiplies its input by a specified factor.",
      examples: [
        {
          input: { factor: 8 },
          output: 'multiplier(6) → 48'
        },
        {
          input: { factor: 10 },
          output: 'multiplier(5) → 50',
        },
        {
          input: { factor: 2 },
          output: 'multiplier(7) → 14',
        },
      ],
      constraints: [
        "Must use a lambda function for the multiplier",
        "The lambda should take exactly one parameter (the number to multiply)",
        "The lambda should capture the factor from the outer function"
      ]
    }
  ],
  methodTemplates: {
    "calculate_sum": `def calculate_sum(self, start: int, end: int) -> int:
    """
    Calculate the sum of numbers in a range from start (inclusive) to end (exclusive).
    
    Args:
        start: The starting number (inclusive)
        end: The ending number (exclusive)
        
    Returns:
        The sum of all numbers in the range
    """
    pass`,
    
    "create_pattern": `def create_pattern(self, numbers: list) -> str:
    """
    Create a pattern string based on divisibility rules:
    - If divisible by 3, add 'X'
    - If divisible by 2, add 'O'
    - Otherwise, add the number as a string
    
    Args:
        numbers: A list of integers
        
    Returns:
        The pattern string based on the rules
    """
    pass`,
    
    "create_multiplier": `def create_multiplier(self, factor: int):
    """
    Create a lambda function that multiplies its input by the given factor.
    
    Args:
        factor: The multiplication factor
        
    Returns:
        A lambda function that takes a number and returns it multiplied by factor
    """
    pass`
  },
  testCases: {
    "calculate_sum": [
      {
        input: { start: 1, end: 6 },
        expected: 15,
        methodId: "calculate_sum"
      },
      {
        input: { start: 5, end: 10 },
        expected: 35,
        methodId: "calculate_sum"
      },
      {
        input: { start: 1, end: 1 },
        expected: 0,
        methodId: "calculate_sum"
      }
    ],
    "create_pattern": [
      {
        input: { numbers: [7, 12, 9, 14, 6, 3] },
        expected: "7OXO6X",
        methodId: "create_pattern"
      },
      {
        input: { numbers: [1, 2, 3, 4, 5, 6] },
        expected: "1OX4OX",
        methodId: "create_pattern"
      },
      {
        input: { numbers: [3, 6, 9, 12, 15, 18] },
        expected: "XXXXXX",
        methodId: "create_pattern"
      }
    ],
    "create_multiplier": [
      {
        input: { factor: 8, test_value: 6 },
        expected: 48,
        methodId: "create_multiplier"
      },
      {
        input: { factor: 10, test_value: 5 },
        expected: 50,
        methodId: "create_multiplier"
      },
      {
        input: { factor: 2, test_value: 7 },
        expected: 14,
        methodId: "create_multiplier"
      }
    ]
  },
  conceptMappings: {
    0: ["Loops", "Range Function"],
    1: ["Conditional Logic", "String Manipulation"],
    2: ["Lambda Functions", "Closures"]
  },
  conceptMap: {
    categories: {
      "Basic Programming": {
        "Conditional Logic": {
          name: "Conditional Logic",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Loops": {
          name: "Loops",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Variable Assignment": {
          name: "Variable Assignment",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      },
      "Functions": {
        "Lambda Functions": {
          name: "Lambda Functions",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      },
      "List Operations": {
        "Indexing": {
          name: "Indexing",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      },
      "String Manipulation": {
        "String Concatenation": {
          name: "String Concatenation",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      }
    }
  },
  system: "ATLAS"
}

const condition2: TaskData = {
  tasks: [
    {
      title: "1.) filter_high_scores()",
      difficulty: "Easy",
      description: "Implement a function that filters a dictionary of scores to create a new dictionary containing only scores above or equal to a threshold. Loop through the input dictionary and add qualifying entries to the result dictionary.",
      examples: [
        {
          input: { scores: {'Alice': 92, 'Bob': 75, 'Charlie': 85, 'David': 70}, threshold: 80 },
          output: "{'Alice': 92, 'Charlie': 85}"
        },
        {
          input: { scores: {'Eva': 95, 'Frank': 68, 'Grace': 79, 'Henry': 88}, threshold: 85 },
          output: "{'Eva': 95, 'Henry': 88}",
        },
        {
          input: { scores: {'Ian': 75, 'Jane': 82, 'Kate': 90}, threshold: 70 },
          output: "{'Ian': 75, 'Jane': 82, 'Kate': 90}",
        },
      ],
      constraints: [
        "Create a new dictionary rather than modifying the input",
        "Use dictionary comprehension or a for loop to filter entries",
        "The threshold is inclusive (scores >= threshold should be included)"
      ]
    },
    {
      title: "2.) slice_string()",
      difficulty: "Easy",
      description: "Implement a function that extracts a substring using Python's slicing notation. The function should take a string and three slice parameters (start, end, step) and return the sliced result.",
      examples: [
        {
          input: { text: "Python Programming", start: 2, end: -2, step: 2 },
          output: '"to rgamn"'
        },
        {
          input: { text: "Hello World", start: 0, end: 5, step: 1 },
          output: '"Hello"',
        },
        {
          input: { text: "abcdefghijk", start: 1, end: 9, step: 3 },
          output: '"bdg"',
        },
      ],
      constraints: [
        "Use Python's slice notation [start:end:step]",
        "Negative indices should count from the end of the string",
        "Step value determines which characters to include in the slice"
      ]
    },
    {
      title: "3.) flatten_matrix()",
      difficulty: "Medium",
      description: "Implement a function that flattens a 2D matrix (list of lists) into a single 1D list. Use list comprehension to concatenate all sub-lists into one flat list.",
      examples: [
        {
          input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
          output: '[1, 2, 3, 4, 5, 6, 7, 8, 9]'
        },
        {
          input: { matrix: [[10, 20], [30, 40], [50, 60]] },
          output: '[10, 20, 30, 40, 50, 60]',
        },
        {
          input: { matrix: [[1, 2], [3]] },
          output: '[1, 2, 3]',
        },
      ],
      constraints: [
        "Use list comprehension rather than nested loops",
        "The order of elements should be preserved (row by row)",
        "Handle matrices with different row lengths"
      ]
    }
  ],
  methodTemplates: {
    "filter_high_scores": `def filter_high_scores(self, scores: dict, threshold: int) -> dict:
    """
    Filter a dictionary of scores to include only those that meet or exceed the threshold.
    
    Args:
        scores: A dictionary with names as keys and scores as values
        threshold: The minimum score to include (inclusive)
        
    Returns:
        A new dictionary with only the entries that meet the threshold
    """
    pass`,
    
    "slice_string": `def slice_string(self, text: str, start: int, end: int, step: int) -> str:
    """
    Extract a substring using Python's slicing notation.
    
    Args:
        text: The input string
        start: The starting index (inclusive)
        end: The ending index (exclusive)
        step: The step size
        
    Returns:
        The sliced string according to [start:end:step]
    """
    pass`,
    
    "flatten_matrix": `def flatten_matrix(self, matrix: list) -> list:
    """
    Flatten a 2D matrix (list of lists) into a single 1D list.
    
    Args:
        matrix: A list of lists containing values
        
    Returns:
        A single flat list containing all values from the matrix
    """
    pass`
  },
  testCases: {
    "filter_high_scores": [
      {
        input: { scores: {'Alice': 92, 'Bob': 75, 'Charlie': 85, 'David': 70}, threshold: 80 },
        expected: {'Alice': 92, 'Charlie': 85},
        methodId: "filter_high_scores"
      },
      {
        input: { scores: {'Eva': 95, 'Frank': 68, 'Grace': 79, 'Henry': 88}, threshold: 85 },
        expected: {'Eva': 95, 'Henry': 88},
        methodId: "filter_high_scores"
      },
      {
        input: { scores: {'Ian': 75, 'Jane': 82, 'Kate': 90}, threshold: 70 },
        expected: {'Ian': 75, 'Jane': 82, 'Kate': 90},
        methodId: "filter_high_scores"
      }
    ],
    "slice_string": [
      {
        input: { text: "Python Programming", start: 2, end: -2, step: 2 },
        expected: "to rgamn",
        methodId: "slice_string"
      },
      {
        input: { text: "Hello World", start: 0, end: 5, step: 1 },
        expected: "Hello",
        methodId: "slice_string"
      },
      {
        input: { text: "abcdefghijk", start: 1, end: 9, step: 3 },
        expected: "bdg",
        methodId: "slice_string"
      }
    ],
    "flatten_matrix": [
      {
        input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
        expected: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        methodId: "flatten_matrix"
      },
      {
        input: { matrix: [[10, 20], [30, 40], [50, 60]] },
        expected: [10, 20, 30, 40, 50, 60],
        methodId: "flatten_matrix"
      },
      {
        input: { matrix: [[1, 2], [3]] },
        expected: [1, 2, 3],
        methodId: "flatten_matrix"
      }
    ]
  },
  conceptMappings: {
    0: ["Dictionary Operations", "Dictionary Creation"],
    1: ["String Manipulation", "Array Manipulation"],
    2: ["List Operations", "Array Manipulation"]
  },
  conceptMap: {
    categories: {
      "Basic Programming": {
        "Conditional Logic": {
          name: "Conditional Logic",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Loops": {
          name: "Loops",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Variable Assignment": {
          name: "Variable Assignment",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      },
      "Dictionary Operations": {
        "Dictionary Creation": {
          name: "Dictionary Creation",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Dictionary Iteration": {
          name: "Dictionary Iteration",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Dictionary Comprehension": {
          name: "Dictionary Comprehension",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      },
      "List Operations": {
        "List Comprehension": {
          name: "List Comprehension",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Nested Lists": {
          name: "Nested Lists",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      },
      "String Manipulation": {
        "String Slicing": {
          name: "String Slicing",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Negative Indexing": {
          name: "Negative Indexing",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      },
      "Array Manipulation": {
        "Matrix Operations": {
          name: "Matrix Operations",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        },
        "Slicing": {
          name: "Slicing",
          value: 0,
          knowledgeState: {
            understandingLevel: 0,
            confidenceInAssessment: 0,
            reasoning: "",
            lastUpdated: "Just now"
          }
        }
      }
    }
  },
  system: "Standalone"
}

const FileContext = createContext<FileContextType | undefined>(undefined)

export const FileProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [cachedFileContent, setCachedFileContent] = useState<string>('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileNode, setFileNode] = useState<FileSystemNode | null>(null)

  const [errorContent, setErrorContent] = useState('')
  const [executionOutput, setExecutionOutput] = useState<string>('')
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [studentTask, setStudentTask] = useState<string>('')

  const [lineNumber, setLineNumber] = useState<number | null>(null)
  
  // Session-related state
  const [sessionId, setSessionId] = useState<string>('5') // Default to session 5
  const [sessionData, setSessionData] = useState<TaskData>(condition1)
  const [currentMethodIndex, setCurrentMethodIndex] = useState<number>(0)
  const [activeMethodId, setActiveMethodId] = useState<string>('calculate_sum')
  const [currentTestCases, setCurrentTestCases] = useState<TestCase[]>(condition1.testCases.calculate_sum)
  
  // System type state
  const [systemType, setSystemType] = useState<'ATLAS' | 'Standalone'>('ATLAS')
  
  // Concept map and pivot state
  const [conceptMapConfidenceMet, setConceptMapConfidenceMet] = useState<boolean>(false)
  const [latestPivotMessage, setLatestPivotMessage] = useState<string | null>(null)

  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [conceptMap, setConceptMap] = useState<any>(condition1.conceptMap);

  const [speakTo, setSpeakTo] = useState<'student' | 'ta'>('ta')
  const [scenario, setScenario] = useState<'one-on-one' | 'group'>('one-on-one')

  const [showReport, setShowReport] = useState<boolean>(false);

  // Extract session ID from URL and update session data
  useEffect(() => {
    const sessionIdMatch = pathname?.match(/\/sessions\/(\d+)/)
    
    if (sessionIdMatch && sessionIdMatch[1]) {
      const newSessionId = sessionIdMatch[1]
      
      if (newSessionId !== sessionId) {
        console.log("Session ID changed from", sessionId, "to", newSessionId)
        setSessionId(newSessionId)
        
        // Set the appropriate session data based on ID
        if (newSessionId === '5') {
          setSessionData(condition1)
          setSystemType('ATLAS') // Update system type
        } else if (newSessionId === '12') {
          setSessionData(condition2)
          setSystemType('Standalone') // Update system type
        }
        
        // Reset to first method when changing sessions
        setCurrentMethodIndex(0)
      }
    }
  }, [pathname, sessionId])
  
  // Update active method ID and test cases when method index or session changes
  useEffect(() => {
    if (sessionData?.tasks && sessionData.tasks[currentMethodIndex]) {
      const title = sessionData.tasks[currentMethodIndex].title
      const match = title.match(/\d+\.\)\s+([a-zA-Z_]+)\(\)/)
      
      if (match) {
        const methodId = match[1]
        setActiveMethodId(methodId)
        
        if (sessionData.testCases[methodId]) {
          setCurrentTestCases(sessionData.testCases[methodId])
        }
      }
    }
  }, [currentMethodIndex, sessionData])

  // Add this useEffect to your FileProvider component
  useEffect(() => {
    // Create an object with all the system information
    const systemInfo = {
      systemType,
      studentTask,
      studentCode: fileContent,
      conceptMapInitial: sessionData.conceptMap,
    };
    
    // Log the entire object for inspection
    console.log('=== SYSTEM INFORMATION ===', systemInfo);
    
    // Log individual components with clearer formatting
    console.log('System Type:', systemType);
    console.log('Student Task:', studentTask);
    console.log('Student Code:', fileContent);
    console.log('Initial Concept Map:', sessionData.conceptMap);
  }, [systemType, studentTask, fileContent, sessionData]);

  const updateConversationHistory = (newHistory: ConversationMessage[]) => {
    setConversationHistory(newHistory);
  };

  const updateConceptMap = (newConceptMap: any) => {
    setConceptMap(newConceptMap);
  };

  const updateHighlightedText = (text: string) => {
    setHighlightedText(text)
  }

  const updateExecutionOutput = (output: string) => {
    setExecutionOutput(output)
  }

  const selectFile = (fileName: string, content: string, path: string) => {
    setSelectedFile(fileName)
    setFileContent(content)
    setCachedFileContent(content)
    setFilePath(path)
  }

  const updateCachedFileContent = (content: string) => {
    setCachedFileContent(content)
  }

  const updateStudentTask = (task: string) => {
    setStudentTask(task)
  }

  const updateLineNumber = (line: number | null) => {
    setLineNumber(line)
  }

  // Add navigation methods for task sidebar
  const goToNextMethod = () => {
    if (currentMethodIndex < sessionData.tasks.length - 1) {
      setCurrentMethodIndex(currentMethodIndex + 1)
    }
  }
  
  const goToPrevMethod = () => {
    if (currentMethodIndex > 0) {
      setCurrentMethodIndex(currentMethodIndex - 1)
    }
  }

  // Add new methods for concept map confidence and pivot
  const updateConceptMapConfidence = (isConfident: boolean) => {
    setConceptMapConfidenceMet(isConfident)
  }

  const updateLatestPivotMessage = (message: string | null) => {
    setLatestPivotMessage(message)
  }

  const isSaved = () => {
    return fileContent === cachedFileContent
  }

  // Update the speakTo role - simplified
  const updateSpeakTo = (role: 'student' | 'ta') => {
    setSpeakTo(role)
  }

  // Update the scenario - simplified
  const updateScenario = (newScenario: 'one-on-one' | 'group') => {
    setScenario(newScenario)
  }

  // Helper function to get method template for the current active method
  const getCurrentMethodTemplate = () => {
    if (activeMethodId && sessionData?.methodTemplates) {
      return sessionData.methodTemplates[activeMethodId]
    }
    return ''
  }

  // Helper function to get all method templates for the current session
  const getAllMethodTemplates = () => {
    return sessionData?.methodTemplates || {}
  }

  // Helper to update the system type manually if needed
  const updateSystemType = (type: 'ATLAS' | 'Standalone') => {
    setSystemType(type);
  }

  return (
    <FileContext.Provider
      value={{
        selectedFile,
        fileContent,
        filePath,
        selectFile,
        cachedFileContent,
        updateCachedFileContent,
        setFileContent,
        errorContent,
        setErrorContent,
        executionOutput,
        updateExecutionOutput,
        isSaved,
        fileNode,
        setFileNode,
        highlightedText,
        updateHighlightedText,
        studentTask,
        updateStudentTask,
        speakTo,
        updateSpeakTo,
        scenario,
        updateScenario,
        lineNumber,
        updateLineNumber,
        conceptMapConfidenceMet,
        updateConceptMapConfidence,
        latestPivotMessage,
        updateLatestPivotMessage,
        sessionId,
        sessionData,
        currentMethodIndex,
        activeMethodId,
        currentTestCases,
        goToNextMethod,
        goToPrevMethod,
        getCurrentMethodTemplate,
        getAllMethodTemplates,
        conversationHistory,
        updateConversationHistory,
        conceptMap,
        updateConceptMap,
        showReport,
        setShowReport,
        systemType,
        updateSystemType,
      }}>
      {children}
    </FileContext.Provider>
  )
}

export const useFile = () => {
  const context = useContext(FileContext)
  if (!context) {
    throw new Error('useFile must be used within a FileProvider')
  }
  return context
}