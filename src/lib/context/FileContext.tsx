import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react'
import { FileSystemNode } from '@/utils/FileUtils'

import { FileContextType, TestCase } from '@/types'

const FileContext = createContext<FileContextType | undefined>(undefined)

export const FileProvider = ({ children }: { children: ReactNode }) => {
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
  
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      input: {
        nums: [2, 7, 11, 15],
        target: 9
      },
      expected: [0, 1]
    },
    {
      input: {
        nums: [3, 2, 4],
        target: 6
      },
      expected: [1, 2]
    },
    {
      input: {
        nums: [3, 3],
        target: 6
      },
      expected: [0, 1]
    }
  ])

  const [speakTo, setSpeakTo] = useState<'student' | 'ta'>('ta')
  const [scenario, setScenario] = useState<'one-on-one' | 'group'>('one-on-one')

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

  const updateTestCases = (newTestCases: TestCase[]) => {
    setTestCases(newTestCases)
  }

  const updateStudentTask = (task: string) => {
    setStudentTask(task)
  }

  const updateLineNumber = (line: number | null) => {
    setLineNumber(line)
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
        testCases,
        updateTestCases,
        studentTask,
        updateStudentTask,
        speakTo,
        updateSpeakTo,
        scenario,
        updateScenario,
        lineNumber,
        updateLineNumber,
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