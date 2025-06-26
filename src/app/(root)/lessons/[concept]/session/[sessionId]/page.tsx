'use client'

import React from 'react';
import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';
import { SophiaBrainProvider } from '@/components/student-side/voice-chat/SophiaBrainProvider'
import { FileProvider } from '@/lib/context/FileContext';
import { Toaster } from 'sonner';

const JoinSessionPage: React.FC = () => {

  return (
      <FileProvider>
        <SophiaBrainProvider>
          <WorkspaceLayout />
        <Toaster position="top-right" />
        </SophiaBrainProvider>
      </FileProvider>
  );
};

export default JoinSessionPage;