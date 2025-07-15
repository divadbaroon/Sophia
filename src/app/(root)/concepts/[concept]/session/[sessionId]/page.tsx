'use client'

import React from 'react';
import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';
import { FileProvider } from '@/lib/context/FileContext';

const JoinSessionPage: React.FC = () => {

  return (
      <FileProvider>
          <WorkspaceLayout />
      </FileProvider>
  );
};

export default JoinSessionPage;