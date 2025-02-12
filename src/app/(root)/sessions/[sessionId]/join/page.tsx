'use client'
import React from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import FileSidebar from '@/components/student-side/file-sidebar/FileSidebar'
import CodeEditor from '@/components/student-side/code-editor/CodeEditor'
import Terminal from '@/components/student-side/terminal/Termainal'
import MainPanel from '@/components/student-side/main-panel/MainPanel'
import { FolderProvider } from '@/components/context/FolderContext'
import { FileProvider } from '@/components/context/FileContext'

interface HomePageProps {}

const PanelWithHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full flex flex-col">
    <div className="h-24 bg-white "></div>  
    <div className="flex-1">
      {children}
    </div>
  </div>
);

const HomePage: React.FC<HomePageProps> = () => {
  return (
    <FolderProvider>
      <FileProvider>
        <main className="flex flex-col h-screen">
          {/* Space for navbar */}
          <div className="h-15"></div>
          {/* Main content */}
          <div className="flex-1 flex">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={20}>
                <PanelWithHeader>
                  <FileSidebar />
                </PanelWithHeader>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={80}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={70}>
                    <ResizablePanelGroup direction="horizontal">
                      <ResizablePanel defaultSize={50}>
                        <PanelWithHeader>
                          <CodeEditor />
                        </PanelWithHeader>
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={50}>
                        <PanelWithHeader>
                          <MainPanel />
                        </PanelWithHeader>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={10}>
                      <Terminal />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </main>
      </FileProvider>
    </FolderProvider>
  )
}

export default HomePage