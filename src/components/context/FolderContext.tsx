import { FileSystemNode } from '@/utils/FileUtils';
import React, { createContext, useContext, useState, ReactNode } from 'react';

import { FolderContextType } from "@/types"

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [fileStructure, setFileStructure] = useState<FileSystemNode[]>([]);

  const updateSelectedFolder = (folderName: string | null) => {
    setSelectedFolder(folderName);
  };

  const updateFileStructure = (structure: FileSystemNode[]) => {
    setFileStructure(structure);
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
