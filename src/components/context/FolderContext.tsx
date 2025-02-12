import { FileSystemNode } from '@/utils/FileUtils';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type FolderContextType = {
  selectedFolder: string | null;
  fileStructure: FileSystemNode[];
  setSelectedFolder: (folderName: string | null) => void;
  setFileStructure: (structure: FileSystemNode[]) => void;
};

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [fileStructure, setFileStructure] = useState<FileSystemNode[]>([]);

  // Load initial state from localStorage after component mounts
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const savedState = JSON.parse(localStorage.getItem('folderContext') || '{}');
  //     if (savedState.selectedFolder) {
  //       setSelectedFolder(savedState.selectedFolder);
  //     }
  //     if (savedState.fileStructure) {
  //       setFileStructure(savedState.fileStructure);
  //     }
  //   }
  // }, []);

  const saveToLocalStorage = (state: Partial<FolderContextType>) => {
    // if (typeof window !== 'undefined') {
    //   const currentState = JSON.parse(localStorage.getItem('folderContext') || '{}');
    //   const newState = { ...currentState, ...state };
    //   localStorage.setItem('folderContext', JSON.stringify(newState));
    // }
  };

  const updateSelectedFolder = (folderName: string | null) => {
    setSelectedFolder(folderName);
    saveToLocalStorage({ selectedFolder: folderName });
  };

  const updateFileStructure = (structure: FileSystemNode[]) => {
    setFileStructure(structure);
    saveToLocalStorage({ fileStructure: structure });
  };

  return (
    <FolderContext.Provider value={{ selectedFolder, fileStructure, setSelectedFolder: updateSelectedFolder, setFileStructure: updateFileStructure }}>
      {children}
    </FolderContext.Provider>
  );
};

export const useFolder = () => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolder must be used within a FolderProvider');
  }
  return context;
};
