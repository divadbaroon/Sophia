'use client'

import React from 'react';
import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';
import { FolderProvider } from '@/components/context/FolderContext';
import { FileProvider } from '@/lib/context/FileContext';
import { Toaster } from 'sonner';

const JoinSessionPage: React.FC = () => {

  return (
    <FolderProvider>
      <FileProvider>
        <WorkspaceLayout />
        <Toaster position="top-right" />
      </FileProvider>
    </FolderProvider>
  );
};

export default JoinSessionPage;