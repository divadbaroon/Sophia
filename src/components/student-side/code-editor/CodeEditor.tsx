'use client'

import React, { useEffect, useRef } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';

import { useFile } from '@/components/context/FileContext';

const CodeEditor = () => {
  const { filePath, cachedFileContent, updateCachedFileContent, fileContent, fileNode, setFileContent, highlightedText, updateHighlightedText} = useFile();
  const editorViewRef = useRef<any>(null); // Ref to store the editor instance

  const handleSave = async () => {
    if (!fileNode || !fileNode.handle || typeof fileNode.handle.createWritable !== 'function') {
      console.error("No valid file node or file handle to save.");
      return;
    }

    try {
      const writableStream = await fileNode.handle.createWritable();
      await writableStream.write(cachedFileContent);
      await writableStream.close();
      setFileContent(cachedFileContent);
      console.log("File saved successfully.");
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const handleCodeChange = (value: string) => {
    updateCachedFileContent(value);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (editorViewRef.current) {
        const state = editorViewRef.current.state;
        const { from, to } = state.selection.main;
  
        if (from !== to) {
          const selectedText = state.sliceDoc(from, to);
          console.log("selected")
          console.log(selectedText)
          console.log("highlighted")
          console.log(highlightedText)
          if (selectedText !== highlightedText) {
            updateHighlightedText(selectedText);
          }
        } else {
          updateHighlightedText('');
        }
      }
    };
  
    const editorElement = editorViewRef.current?.dom;
  
    if (editorElement) {
      editorElement.addEventListener('mouseup', handleMouseUp);
  
      return () => {
        editorElement.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [editorViewRef, updateHighlightedText, highlightedText]);

  return (
    <>
      {filePath ? (
        <div className="flex justify-between items-center mt-20">
          <Breadcrumb className="pl-4 m-3">
            <BreadcrumbList>
              {filePath.split('/').filter(Boolean).map((part, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    <BreadcrumbLink>
                      {part}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < filePath.split('/').filter(Boolean).length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex gap-2 m-2">
            {fileContent !== cachedFileContent && (
              <Button className="h-6 w-12" onClick={handleSave}>Save</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          <p>Please select a file on the left.</p>
        </div>
      )}
      <ScrollArea className="h-full w-full">
        <CodeMirror
          value={fileContent}
          height="100%"
          theme={vscodeLight}
          extensions={[javascript()]}
          onChange={handleCodeChange}
          onUpdate={(viewUpdate) => {
            editorViewRef.current = viewUpdate.view;
          }}
        />
      </ScrollArea>
    </>
  );
};

export default CodeEditor;