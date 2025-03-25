'use client'

import React, { useImperativeHandle, forwardRef, Ref } from 'react'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import QuestionPanel from '@/components/student-side/question-panel/QuestionPanel'
import { ConversationManagerProvider, useConversationManagerContext } from '@/lib/context/ConversationManagerContext'
import { CodeEditorRef } from '@/components/student-side/code-editor/CodeEditor'

type PanelType = 'question' | 'none'

// Create an interface for the wrapper ref
export interface QuestionPanelWrapperRef {
  highlightLine: (lineNumber: number) => void;
  clearHighlight: () => void;
}

interface QuestionPanelWrapperProps {
  editorRef?: React.RefObject<CodeEditorRef | null>;
}

interface InitializationStatusProps {
  onRetry: () => void;
}

// Component to show loading or initialization error
const InitializationStatus: React.FC<InitializationStatusProps> = ({ onRetry }) => {
  const { error, isInitialized } = useConversationManagerContext();
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">
          Failed to initialize conversation system. Please check your network connection.
        </div>
        <Button onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse text-muted-foreground">
          Initializing conversation system...
        </div>
      </div>
    );
  }
  
  return null;
};

interface QuestionPanelContentProps {
  editorRef?: React.RefObject<CodeEditorRef | null>;
  forwardedRef: Ref<QuestionPanelWrapperRef>;
}

const QuestionPanelContent: React.FC<QuestionPanelContentProps> = ({ editorRef, forwardedRef }) => {
  const [panelType, setPanelType] = React.useState<PanelType>('question');
  const { isInitialized, error } = useConversationManagerContext();
  const [retryCount, setRetryCount] = React.useState(0);

  // Function to highlight a line in the editor
  const highlightLine = (lineNumber: number) => {
    if (editorRef?.current) {
      editorRef.current.highlightLine(lineNumber);
    }
  };

  // Function to clear highlighting
  const clearHighlight = () => {
    if (editorRef?.current) {
      editorRef.current.clearHighlight();
    }
  };

  // Expose the highlight functions through the forwarded ref
  useImperativeHandle(forwardedRef, () => ({
    highlightLine,
    clearHighlight
  }));

  // Ensure we clear highlights when the panel itself unmounts
  React.useEffect(() => {
    return () => {
      clearHighlight();
    };
  }, []);

  // Check if we need to show initialization status
  if (!isInitialized || error) {
    console.log(retryCount)
    return <InitializationStatus onRetry={() => setRetryCount(prev => prev + 1)} />;
  }

  const renderPanel = () => {
    switch (panelType) {
      case 'question':
        return (
          <QuestionPanel 
            onBack={() => {
              setPanelType('none');
              clearHighlight(); // Clear highlight when navigating back
            }} 
            onLineDetected={highlightLine}
            onClearHighlight={clearHighlight}
          />
        )
      default:
        return (
          <div className="flex flex-col justify-center items-center gap-4 h-full">
            <Button
              className="w-32 flex justify-start items-center relative"
              onClick={() => setPanelType('question')}>
              <HelpCircle className="h-4 w-4 absolute left-2" />
              <span className="ml-4">Ask Question</span>
            </Button>
          </div>
        )
    }
  };

  return <div className="h-full">{renderPanel()}</div>;
};

const QuestionPanelWrapper = forwardRef<QuestionPanelWrapperRef, QuestionPanelWrapperProps>(
  ({ editorRef }, ref) => {
    return (
      <ConversationManagerProvider>
        <QuestionPanelContent editorRef={editorRef} forwardedRef={ref} />
      </ConversationManagerProvider>
    );
  }
);

export default QuestionPanelWrapper;