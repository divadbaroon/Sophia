'use client'

import React from 'react';
import { AuthDialog } from '@/components/student-side/auth/AuthDialog';
import { WorkspaceLayout } from '@/components/student-side/work-pace/WorkSpace';
import { FolderProvider } from '@/components/context/FolderContext';
import { FileProvider } from '@/lib/context/FileContext';
import { useAuth } from '@/hooks/useAuth';

const JoinSessionPage: React.FC = () => {
  const {
    isAuthenticated,
    user,
    showDialog,
    handleCreateAccount,
    handleContinueWithExisting,
    handleCreateNew,
    closeDialog
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <AuthDialog
        isOpen={showDialog}
        onClose={closeDialog}
        onCreateAccount={handleCreateAccount}
        existingUser={user || undefined}
        onContinueWithExisting={handleContinueWithExisting}
        onCreateNew={handleCreateNew}
      />
    );
  }

  return (
    <FolderProvider>
      <FileProvider>
        <WorkspaceLayout />
      </FileProvider>
    </FolderProvider>
  );
};

export default JoinSessionPage;