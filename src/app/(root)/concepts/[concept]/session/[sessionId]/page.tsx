'use client'

import React from 'react';
import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';

import { SessionProvider, CodeEditorProvider, ConceptMapProvider  } from '@/lib/context';

const JoinSessionPage = () => {
  return (
    <SessionProvider>
      <CodeEditorProvider>
          <ConceptMapProvider>
              <WorkspaceLayout />
          </ConceptMapProvider>
      </CodeEditorProvider>
    </SessionProvider>
  );
};
export default JoinSessionPage;