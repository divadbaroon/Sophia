'use client'

import React from 'react';
import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';
import { SophiaBrainProvider } from '@/components/student-side/voice-chat/provider/SophiaBrainProvider'
import { FileProvider } from '@/lib/context/FileContext';

const JoinSessionPage: React.FC = () => {

  return (
      <FileProvider>
        <SophiaBrainProvider>
          <WorkspaceLayout />
        </SophiaBrainProvider>
      </FileProvider>
  );
};

export default JoinSessionPage;