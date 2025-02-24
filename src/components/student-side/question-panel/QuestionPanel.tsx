import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeepgram } from '@/components/audio/DeepgramContext';

interface QuestionPanelProps {
  onBack: () => void;
  isVisible?: boolean;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ onBack, isVisible = true }) => {
  const {
    isStarted,
    setIsStarted,
    transcript,
    conversationHistory,
    isRecording,
    isSpeaking,
    error,
    startRecording,
    clearError
  } = useDeepgram();

  React.useEffect(() => {
    if (isStarted && !isRecording) {
      startRecording();
    }
  }, [isStarted, isRecording, startRecording]);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => {
          clearError();
          setIsStarted(false);
        }}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="p-6 text-center">
        <Mic className="h-12 w-12 mx-auto text-primary mb-3" />
        <p className="text-muted-foreground mb-4">
          I'm here to help understand your coding problems.
        </p>
        <Button 
          onClick={() => setIsStarted(true)} 
          size="default"
        >
          Begin Conversation
        </Button>
      </div>
    );
  }

  const renderRecordingStatus = () => {
    if (!isRecording) return <span>Recording stopped</span>;
    
    if (isSpeaking) {
      return (
        <>
          <span className="text-muted-foreground">Recording: </span>
          <span className="text-primary">{transcript}</span>
        </>
      );
    }
    
    return <span>{transcript || "Waiting for speech..."}</span>;
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="question" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="question">Current</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
        </TabsList>

        <TabsContent value="question" className="mt-4">
          <ScrollArea className="rounded-md border p-4 h-32">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-lg text-muted-foreground mt-7">
                {renderRecordingStatus()}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="conversation" className="mt-4">
          <ScrollArea className="rounded-md border h-96">
            <div className="space-y-4 p-4">
              {conversationHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' ? 'bg-muted' : 'border'
                  }`}
                >
                  {message.role === 'user' ? (
                    <>
                      <strong className="text-primary">You: </strong>
                      {message.content}
                    </>
                  ) : (
                    <div className="flex items-start">
                      <Bot className="h-5 w-5 mr-2 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <strong className="text-primary">Assistant: </strong>
                        <div className="prose prose-sm mt-1">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {!transcript && conversationHistory.length === 0 && (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Your conversation will appear here
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionPanel;