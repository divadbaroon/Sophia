'use client'

import React from 'react';

import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';

import { SessionProvider, CodeEditorProvider, ConversationProvider, ConceptMapProvider  } from '@/lib/context';

const JoinSessionPage = () => {
  return (
    <SessionProvider>
      <CodeEditorProvider>
          <ConversationProvider>
            <ConceptMapProvider>
                <WorkspaceLayout />
            </ConceptMapProvider>
          </ConversationProvider>
      </CodeEditorProvider>
    </SessionProvider>
  );
};
export default JoinSessionPage;