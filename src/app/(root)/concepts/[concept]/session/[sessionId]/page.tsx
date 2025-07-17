'use client'

import React from 'react';
import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';

import { SessionProvider, CodeEditorProvider, TaskProgressProvider, ConceptMapProvider  } from '@/lib/context';

const JoinSessionPage = () => {
  return (
    <SessionProvider>
      <CodeEditorProvider>
        <TaskProgressProvider>
          <ConceptMapProvider>
              <WorkspaceLayout />
          </ConceptMapProvider>
        </TaskProgressProvider>
      </CodeEditorProvider>
    </SessionProvider>
  );
};
export default JoinSessionPage;