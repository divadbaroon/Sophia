'use client'

import React, { useState } from 'react'

import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { Button } from '@/components/ui/button'
import Collapse from '@mui/material/Collapse'
import { ScrollArea } from '@/components/ui/scroll-area'
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { ListItemIcon } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { readDirectory, FileSystemNode } from '@/utils/FileUtils'

import { useFile } from '@/components/context/FileContext';
import { useFolder } from '@/components/context/FolderContext';

export default function FileSidebar() {
  const { selectedFolder, fileStructure, setSelectedFolder, setFileStructure } = useFolder();
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const { selectFile,setFileNode  } = useFile();

  const handleFolderSelect = async () => {
    const root = await readDirectory()
    if (root) {
      setSelectedFolder(root.name)
      setFileStructure([root])
    }
  }

  const toggleFolder = (folderName: string) => {
    setOpenFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderName)) {
        newSet.delete(folderName)
      } else {
        newSet.add(folderName)
      }
      return newSet
    })
  }

  const handleFileClick = async (fileName: string) => {
    // Simulate fetching file content
    const content = await fetchFileContent(fileName);
    const filePath = findFilePath(fileStructure, fileName);
    selectFile(fileName, content, filePath);
  };

  const renderFileSystem = (nodes: FileSystemNode[], level = 1) => {
    return nodes.map(node => (
      <div key={node.name}>
        <ListItem
          onClick={() => node.kind === 'file' ? handleFileClick(node.name) : toggleFolder(node.name)}
          sx={{ pl: level * 4 }}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            {node.kind === 'directory' ? <FolderIcon /> : <InsertDriveFileIcon />}
          </ListItemIcon>
          <ListItemText primary={node.name} />
          {node.kind === 'directory' && (
            openFolders.has(node.name) ? <ExpandLess /> : <ExpandMore />
          )}
        </ListItem>
        {node.kind === 'directory' && (
          <Collapse in={openFolders.has(node.name)} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children && renderFileSystem(node.children, level + 1)}
            </List>
          </Collapse>
        )}
      </div>
    ))
  }

  const fetchFileContent = async (fileName: string) => {
    const fileNode = findFileNode(fileStructure, fileName);
    setFileNode(fileNode);
    if (!fileNode || !fileNode.handle) {
      throw new Error(`File ${fileName} not found or handle is missing`);
    }

    // Check if handle is a FileSystemFileHandle
    if (typeof fileNode.handle.getFile === 'function') {
      const file = await fileNode.handle.getFile();
      const content = await file.text();
      return content;
    } else {
      throw new Error(`Handle for ${fileName} is not a FileSystemFileHandle`);
    }
  };

  const findFileNode = (nodes: FileSystemNode[], fileName: string): FileSystemNode | null => {
    for (const node of nodes) {
      if (node.kind === 'file' && node.name === fileName) {
        return node;
      } else if (node.kind === 'directory' && node.children) {
        const found = findFileNode(node.children, fileName);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to find a file path by name
  const findFilePath = (nodes: FileSystemNode[], fileName: string, currentPath = ''): string => {
    for (const node of nodes) {
      const newPath = `${currentPath}/${node.name}`;
      if (node.kind === 'file' && node.name === fileName) {
        return newPath;
      } else if (node.kind === 'directory' && node.children) {
        const foundPath = findFilePath(node.children, fileName, newPath);
        if (foundPath) return foundPath;
      }
    }
    return '';
  };

  return (
    <div className="h-full flex flex-col">
      {!selectedFolder ? (
        <div className="flex justify-center items-center h-full">
          <Button onClick={handleFolderSelect}>
            <FolderIcon className="mr-2" />Open Folder...
          </Button>
        </div>
      ) : (
        <>

          <ScrollArea className="h-full">
            <List>
              {renderFileSystem(fileStructure)}
            </List>
          </ScrollArea>
          <div className="border-t border-gray-300 mx-4" />
          <div className="flex justify-center items-center w-full">
            <Button className="w-full m-2" onClick={handleFolderSelect}>
              <FolderIcon className="mr-2" />Open Folder...
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
