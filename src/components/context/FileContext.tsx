import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react'
import{ FileSystemNode } from '@/utils/FileUtils'

type FileContextType = {
  selectedFile: string | null
  fileContent: string
  cachedFileContent: string
  filePath: string | null
  fileNode: FileSystemNode | null;
  setFileContent: (content: string) => void
  selectFile: (fileName: string, content: string, path: string, node: FileSystemNode | null ) => void
  updateCachedFileContent: (content: string) => void
  setFileNode: (node: FileSystemNode | null) => void; 
  errorContent: string  
  setErrorContent: (error: string) => void  
  isSaved: () => boolean
  highlightedText: string; // Add this for the highlighted text
  updateHighlightedText: (text: string) => void; // Add this for the update function
}

const FileContext = createContext<FileContextType | undefined>(undefined)

export const FileProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [cachedFileContent, setCachedFileContent] = useState<string>('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileNode, setFileNode] = useState<FileSystemNode | null>(null); 
  const [errorContent, setErrorContent] = useState('') 
  const [highlightedText, setHighlightedText] = useState<string>('');

  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const initialFileState = JSON.parse(localStorage.getItem('fileContext') || '{}');
  //     setSelectedFile(initialFileState.selectedFile || null);
  //     setFileContent(initialFileState.fileContent || '');
  //     setCachedFileContent(initialFileState.cachedFileContent || '');
  //     setFilePath(initialFileState.filePath || null);
  //   }
  // }, []);

  const updateHighlightedText = (text: string) => {
    setHighlightedText(text);
  };

  const saveToLocalStorage = (state: Partial<FileContextType>) => {
    // if (typeof window === 'undefined') return;
    // const currentState = JSON.parse(localStorage.getItem('fileContext') || '{}');
    // const newState = { ...currentState, ...state };
    // localStorage.setItem('fileContext', JSON.stringify(newState));
  }

  const selectFile = (fileName: string, content: string, path: string) => {
    setSelectedFile(fileName)
    setFileContent(content)
    setCachedFileContent(content)
    setFilePath(path)
    saveToLocalStorage({
      selectedFile: fileName,
      fileContent: content,
      cachedFileContent: content,
      filePath: path,
    })
  }

  const updateCachedFileContent = (content: string) => {
    setCachedFileContent(content)
    saveToLocalStorage({ cachedFileContent: content })
  }

  const isSaved = () => {
    return fileContent === cachedFileContent
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
        isSaved,
        fileNode,
        setFileNode,
        highlightedText, // Include highlightedText in context
        updateHighlightedText, // Include update function
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