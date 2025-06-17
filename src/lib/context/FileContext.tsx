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

// Define the session data structure with all three lambda tasks
const condition2: TaskData = {
  tasks: [
    {
      title: "1.) create_multiplier()",
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
    },
    {
      title: "2.) create_calculator()",
      difficulty: "Hard",
      description: "Create a function that generates a calculator lambda function. The function should return a lambda that takes two numbers and performs a specified operation on them.",
      examples: [
        {
          input: { operation: "add" },
          output: 'calculator(10, 5) → 15'
        },
        {
          input: { operation: "subtract" },
          output: 'calculator(15, 8) → 7',
        },
        {
          input: { operation: "multiply" },
          output: 'calculator(4, 7) → 28',
        },
        {
          input: { operation: "divide" },
          output: 'calculator(20, 4) → 5.0',
        },
      ],
      constraints: [
        "Must use a lambda function for the calculator",
        "The lambda should take exactly two parameters (a, b)",
        "The lambda should capture the operation from the outer function",
        "Support operations: 'add', 'subtract', 'multiply', 'divide'"
      ]
    },
    {
      title: "3.) create_triple_operator()",
      difficulty: "Hard",
      description: "Create a function that generates a lambda function that takes three numbers and performs a specified operation on them. The operation combines all three numbers according to the given operation type.",
      examples: [
        {
          input: { operation: "sum" },
          output: 'triple_op(5, 10, 3) → 18'
        },
        {
          input: { operation: "average" },
          output: 'triple_op(6, 9, 12) → 9.0',
        },
        {
          input: { operation: "product" },
          output: 'triple_op(2, 4, 5) → 40',
        },
        {
          input: { operation: "max_minus_min" },
          output: 'triple_op(8, 3, 11) → 8',
        },
      ],
      constraints: [
        "Must use a lambda function for the triple operator",
        "The lambda should take exactly three parameters (a, b, c)",
        "The lambda should capture the operation from the outer function",
        "Support operations: 'sum', 'average', 'product', 'max_minus_min'"
      ]
    }
  ],
  methodTemplates: {
    "create_multiplier": `def create_multiplier(factor: int):
    pass`,
    "create_calculator": `def create_calculator(operation: str):
    pass`,
    "create_triple_operator": `def create_triple_operator(operation: str):
    pass`
  },
  testCases: {
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
    ],
    "create_calculator": [
      {
        input: { operation: "add", x: 10, y: 5 },
        expected: 15,
        methodId: "create_calculator"
      },
      {
        input: { operation: "subtract", x: 15, y: 8 },
        expected: 7,
        methodId: "create_calculator"
      },
      {
        input: { operation: "multiply", x: 4, y: 7 },
        expected: 28,
        methodId: "create_calculator"
      },
      {
        input: { operation: "divide", x: 20, y: 4 },
        expected: 5.0,
        methodId: "create_calculator"
      }
    ],
    "create_triple_operator": [
      {
        input: { operation: "sum", a: 5, b: 10, c: 3 },
        expected: 18,
        methodId: "create_triple_operator"
      },
      {
        input: { operation: "average", a: 6, b: 9, c: 12 },
        expected: 9.0,
        methodId: "create_triple_operator"
      },
      {
        input: { operation: "product", a: 2, b: 4, c: 5 },
        expected: 40,
        methodId: "create_triple_operator"
      },
      {
        input: { operation: "max_minus_min", a: 8, b: 3, c: 11 },
        expected: 8,
        methodId: "create_triple_operator"
      }
    ]
  },
  conceptMappings: {
    0: ["Lambda Functions"],
    1: ["Lambda Functions"],
    2: ["Lambda Functions"]
  },
  conceptMap: {
    categories: {
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
    }
  },
  system: "ATLAS"
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
  const [sessionData, setSessionData] = useState<TaskData>(condition2)
  const [currentMethodIndex, setCurrentMethodIndex] = useState<number>(0)
  const [activeMethodId, setActiveMethodId] = useState<string>('filter_high_scores')
  const [currentTestCases, setCurrentTestCases] = useState<TestCase[]>(condition2.testCases.filter_high_scores)
  
  // System type state
  const [systemType, setSystemType] = useState<'ATLAS' | 'Standalone'>('ATLAS')
  
  // Concept map and pivot state
  const [conceptMapConfidenceMet, setConceptMapConfidenceMet] = useState<boolean>(false)
  const [latestPivotMessage, setLatestPivotMessage] = useState<string | null>(null)

  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [conceptMap, setConceptMap] = useState<any>(condition2.conceptMap);

  const [speakTo, setSpeakTo] = useState<'student' | 'ta'>('ta')
  const [scenario, setScenario] = useState<'one-on-one' | 'group'>('one-on-one')

  const [showReport, setShowReport] = useState<boolean>(false);

  const [pivotQueue, setPivotQueue] = useState<Array<{concept: string, category: string, confidence: number}>>([]);

  const [conceptMapInitializing, setConceptMapInitializing] = useState<boolean>(false);

  // Add simple boolean completion tracking state
  const [taskCompletionStatus, setTaskCompletionStatus] = useState<Record<string, Record<number, boolean>>>({})

  // Load completion status from localStorage when session changes
  useEffect(() => {
    if (sessionId) {
      const storageKey = `task_completion_${sessionId}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const completedData = JSON.parse(saved)
          setTaskCompletionStatus(prev => ({
            ...prev,
            [sessionId]: completedData
          }))
        } catch (error) {
          console.error('Error loading completion status:', error)
          // Initialize with false for all tasks
          const initialStatus: Record<number, boolean> = {}
          sessionData?.tasks.forEach((_, index) => {
            initialStatus[index] = false
          })
          setTaskCompletionStatus(prev => ({
            ...prev,
            [sessionId]: initialStatus
          }))
        }
      } else {
        // Initialize empty status for new session
        const initialStatus: Record<number, boolean> = {}
        sessionData?.tasks.forEach((_, index) => {
          initialStatus[index] = false
        })
        setTaskCompletionStatus(prev => ({
          ...prev,
          [sessionId]: initialStatus
        }))
      }
    }
  }, [sessionId, sessionData])

  // Save completion status to localStorage when it changes
  useEffect(() => {
    if (sessionId && taskCompletionStatus[sessionId]) {
      const storageKey = `task_completion_${sessionId}`
      localStorage.setItem(storageKey, JSON.stringify(taskCompletionStatus[sessionId]))
    }
  }, [taskCompletionStatus, sessionId])

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
          setSessionData(condition2)
          setSystemType('ATLAS') 
        } else if (newSessionId === '12') {
          setSessionData(condition2)
          setSystemType('ATLAS') 
        } else if (newSessionId === '7') {
          setSessionData(condition2)
          setSystemType('ATLAS') 
        } else if (newSessionId === '6') {
          setSessionData(condition2)
          setSystemType('ATLAS') 
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

  const updatePivotQueue = (queue: Array<{concept: string, category: string, confidence: number}>) => {
    setPivotQueue(queue);
  }

  const updateConceptMapInitializing = (isInitializing: boolean) => {
    setConceptMapInitializing(isInitializing);
    console.log(`Concept map initialization state updated to: ${isInitializing ? 'initializing' : 'complete'}`);
  };

  // Task completion functions
  const markTaskCompleted = (taskIndex: number) => {
    if (!sessionId) return
    
    setTaskCompletionStatus(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [taskIndex]: true
      }
    }))
  }

  const isTaskCompleted = (taskIndex: number): boolean => {
    if (!sessionId) return false
    return taskCompletionStatus[sessionId]?.[taskIndex] || false
  }

  const isTaskUnlocked = (taskIndex: number): boolean => {
    // First task is always unlocked
    if (taskIndex === 0) return true
    
    // Check if previous task is completed
    return isTaskCompleted(taskIndex - 1)
  }

  const canGoToNext = (): boolean => {
    // Can't go to next if we're at the last task
    if (currentMethodIndex >= (sessionData?.tasks.length || 0) - 1) return false
    
    // Can go to next if current task is completed
    return isTaskCompleted(currentMethodIndex)
  }

  const getCompletionStats = () => {
    if (!sessionId || !sessionData) return { completed: 0, total: 0 }
    
    const sessionStatus = taskCompletionStatus[sessionId] || {}
    const completed = Object.values(sessionStatus).filter(Boolean).length
    const total = sessionData.tasks.length
    return { completed, total }
  }
  
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
        pivotQueue,
        updatePivotQueue,
        conceptMapInitializing,
        updateConceptMapInitializing,
        // Task completion methods
        markTaskCompleted,
        isTaskCompleted,
        isTaskUnlocked,
        canGoToNext,
        getCompletionStats,
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