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
import { getCodingTasksForLesson } from '@/lib/actions/coding-tasks-actions'
import { 
  getTaskProgressForSession, 
  markTaskCompleted as dbMarkTaskCompleted,
  recordTaskAttempt 
} from '@/lib/actions/task-progress-actions'

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
  const [sessionId, setSessionId] = useState<string>('')
  const [lessonId, setLessonId] = useState<string>('')
  const [sessionData, setSessionData] = useState<TaskData | null>(null)
  console.log("TESTING", sessionData)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [currentMethodIndex, setCurrentMethodIndex] = useState<number>(0)
  const [activeMethodId, setActiveMethodId] = useState<string>('')
  const [currentTestCases, setCurrentTestCases] = useState<TestCase[]>([])
  
  // System type state
  const [systemType, setSystemType] = useState<'SOPHIA' | 'Standalone'>('SOPHIA')
  
  // Concept map and pivot state
  const [conceptMapConfidenceMet, setConceptMapConfidenceMet] = useState<boolean>(false)
  const [latestPivotMessage, setLatestPivotMessage] = useState<string | null>(null)

  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [conceptMap, setConceptMap] = useState<any>(null)

  const [speakTo, setSpeakTo] = useState<'student' | 'ta'>('ta')
  const [scenario, setScenario] = useState<'one-on-one' | 'group'>('one-on-one')

  const [showReport, setShowReport] = useState<boolean>(false)

  const [pivotQueue, setPivotQueue] = useState<Array<{concept: string, category: string, confidence: number}>>([])

  const [conceptMapInitializing, setConceptMapInitializing] = useState<boolean>(false)

  // completion tracking state 
  const [taskCompletionStatus, setTaskCompletionStatus] = useState<Record<string, Record<number, boolean>>>({})
  const [isLoadingTaskProgress, setIsLoadingTaskProgress] = useState(false)

  // Extract lesson ID and session ID from URL
  useEffect(() => {
    // Match pattern: /lessons/[lessonId]/session/[sessionId]
    const urlMatch = pathname?.match(/\/lessons\/([^\/]+)\/session\/([^\/]+)/)
    
    if (urlMatch) {
      const [, newLessonId, newSessionId] = urlMatch
      
      if (newLessonId !== lessonId || newSessionId !== sessionId) {
        console.log("URL changed - Lesson ID:", newLessonId, "Session ID:", newSessionId)
        setLessonId(newLessonId)
        setSessionId(newSessionId)
        setCurrentMethodIndex(0) // Reset to first task
      }
    }
  }, [pathname, lessonId, sessionId])

  // Load coding tasks when lesson ID changes
  useEffect(() => {
    const loadCodingTasks = async () => {
      if (!lessonId) return
      
      setIsLoadingTasks(true)
      
      try {
        const result = await getCodingTasksForLesson(lessonId)
        
        if (result.data) {
          const taskData: TaskData = {
            tasks: result.data.tasks,
            methodTemplates: result.data.methodTemplates,
            testCases: result.data.testCases,
            conceptMappings: result.data.conceptMappings,
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
                }
              }
            },
            system: result.data.system
          }
          
          setSessionData(taskData)
          setConceptMap(taskData.conceptMap)
        } else {
          console.error('Failed to load coding tasks:', result.error)
        }
      } catch (error) {
        console.error('Error loading coding tasks:', error)
      } finally {
        setIsLoadingTasks(false)
      }
    }

    loadCodingTasks()
  }, [lessonId])

  // Load completion status from database when session changes
  useEffect(() => {
    const loadTaskProgress = async () => {
      if (!sessionId) return
      
      setIsLoadingTaskProgress(true)
      
      try {
        // Try to load from database first
        const result = await getTaskProgressForSession()
        
        if (result.success && result.data) {
          // Convert database format to local state format
          const progressMap: Record<number, boolean> = {}
          result.data.forEach((progress: any) => {
            progressMap[progress.task_index] = progress.completed
          })
          
          setTaskCompletionStatus(prev => ({
            ...prev,
            [sessionId]: progressMap
          }))
          
          console.log('✅ Loaded task progress from database:', progressMap)
        } else {
          // Fallback to localStorage if database fails
          console.log('⚠️ Database load failed, trying localStorage...')
          const storageKey = `task_completion_${sessionId}`
          const saved = localStorage.getItem(storageKey)
          
          if (saved) {
            try {
              const completedData = JSON.parse(saved)
              setTaskCompletionStatus(prev => ({
                ...prev,
                [sessionId]: completedData
              }))
              console.log('📱 Loaded task progress from localStorage:', completedData)
            } catch (error) {
              console.error('Error parsing localStorage data:', error)
              initializeEmptyProgress()
            }
          } else {
            initializeEmptyProgress()
          }
        }
      } catch (error) {
        console.error('Error loading task progress:', error)
        initializeEmptyProgress()
      } finally {
        setIsLoadingTaskProgress(false)
      }
    }

    const initializeEmptyProgress = () => {
      const initialStatus: Record<number, boolean> = {}
      sessionData?.tasks.forEach((_, index) => {
        initialStatus[index] = false
      })
      setTaskCompletionStatus(prev => ({
        ...prev,
        [sessionId]: initialStatus
      }))
      console.log('🔄 Initialized empty task progress')
    }

    if (sessionId && sessionData) {
      loadTaskProgress()
    }
  }, [sessionId, sessionData])

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

  // System information logging
  useEffect(() => {
    if (!sessionData || isLoadingTasks) return
    
    const systemInfo = {
      systemType,
      studentTask,
      studentCode: fileContent,
      conceptMapInitial: sessionData.conceptMap,
    }
    
    console.log('=== SYSTEM INFORMATION ===', systemInfo)
    console.log('System Type:', systemType)
    console.log('Student Task:', studentTask)
    console.log('Student Code:', fileContent)
    console.log('Initial Concept Map:', sessionData.conceptMap)
  }, [systemType, studentTask, fileContent, sessionData, isLoadingTasks])

  // Helper functions
  const updatePivotQueue = (queue: Array<{concept: string, category: string, confidence: number}>) => {
    setPivotQueue(queue)
  }

  const updateConceptMapInitializing = (isInitializing: boolean) => {
    setConceptMapInitializing(isInitializing)
    console.log(`Concept map initialization state updated to: ${isInitializing ? 'initializing' : 'complete'}`)
  }

  // Updated task completion functions with database integration
  const markTaskCompleted = async (taskIndex: number, testCasesPassed?: number, totalTestCases?: number) => {
    if (!sessionId) return
    
    // Update local state immediately for responsive UI
    setTaskCompletionStatus(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [taskIndex]: true
      }
    }))
    
    // Save to database
    try {
      const result = await dbMarkTaskCompleted(sessionId, taskIndex, testCasesPassed, totalTestCases)
      if (result.success) {
        console.log(`✅ Task ${taskIndex} completion saved to database`)
      } else {
        console.error('❌ Failed to save task completion to database:', result.error)
      }
    } catch (error) {
      console.error('❌ Error saving task completion:', error)
    }
  }

  // New function to record attempts without completing
  const recordAttempt = async (taskIndex: number, testCasesPassed: number, totalTestCases: number) => {
    if (!sessionId) return
    
    try {
      const result = await recordTaskAttempt(sessionId, taskIndex, testCasesPassed, totalTestCases)
      if (result.success) {
        console.log(`📝 Task ${taskIndex} attempt recorded: ${testCasesPassed}/${totalTestCases} test cases passed`)
      } else {
        console.error('❌ Failed to record task attempt:', result.error)
      }
    } catch (error) {
      console.error('❌ Error recording task attempt:', error)
    }
  }

  const isTaskCompleted = (taskIndex: number): boolean => {
    if (!sessionId) return false
    return taskCompletionStatus[sessionId]?.[taskIndex] || false
  }

  const isTaskUnlocked = (taskIndex: number): boolean => {
    if (taskIndex === 0) return true
    return isTaskCompleted(taskIndex - 1)
  }

  const canGoToNext = (): boolean => {
    if (currentMethodIndex >= (sessionData?.tasks.length || 0) - 1) return false
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
    setConversationHistory(newHistory)
  }

  const updateConceptMap = (newConceptMap: any) => {
    setConceptMap(newConceptMap)
  }

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

  const goToNextMethod = () => {
    if (sessionData && currentMethodIndex < sessionData.tasks.length - 1) {
      setCurrentMethodIndex(currentMethodIndex + 1)
    }
  }
  
  const goToPrevMethod = () => {
    if (currentMethodIndex > 0) {
      setCurrentMethodIndex(currentMethodIndex - 1)
    }
  }

  const updateConceptMapConfidence = (isConfident: boolean) => {
    setConceptMapConfidenceMet(isConfident)
  }

  const updateLatestPivotMessage = (message: string | null) => {
    setLatestPivotMessage(message)
  }

  const isSaved = () => {
    return fileContent === cachedFileContent
  }

  const updateSpeakTo = (role: 'student' | 'ta') => {
    setSpeakTo(role)
  }

  const updateScenario = (newScenario: 'one-on-one' | 'group') => {
    setScenario(newScenario)
  }

  const getCurrentMethodTemplate = () => {
    if (activeMethodId && sessionData?.methodTemplates) {
      return sessionData.methodTemplates[activeMethodId]
    }
    return ''
  }

  const getAllMethodTemplates = () => {
    return sessionData?.methodTemplates || {}
  }

  const updateSystemType = (type: 'SOPHIA' | 'Standalone') => {
    setSystemType(type)
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
        lessonId,
        sessionData,
        isLoadingTasks,
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
        markTaskCompleted,
        recordAttempt, 
        isTaskCompleted,
        isTaskUnlocked,
        canGoToNext,
        getCompletionStats,
        isLoadingTaskProgress, 
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