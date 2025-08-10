import { useEffect } from 'react';
import { useSession } from '@/lib/context/session/SessionProvider';
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider';
import { useConversation } from '@/lib/context/conversation/conversationHistoryProvider';
import { ConversationMessage } from '@/types';

interface SophiaContext {
  // Student state
  currentTask: {
    title: string;
    methodId: string;
    index: number;
    description: string;
    examples: any[];
  };
  
  // Code context
  code: {
    current: string;
    highlighted?: string;
  };
  
  // Execution context (always included)
  execution: {
    output: string;
    errors: string;
  };
  
  // Educational context
  methodTemplate: string;
  testCases: any[];
  
  // Conversation context
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  
  // Session metadata
  sessionId: string;
  lessonId: string;
}

export const useSophiaContext = () => {
  const { 
    sessionData, 
    sessionId, 
    lessonId, 
    activeMethodId, 
    currentMethodIndex,
    currentTestCases 
  } = useSession();
  
  const { 
    fileContent, 
    executionOutput, 
    errorContent, 
    highlightedText, 
  } = useCodeEditor();
  
  const { conversationHistory } = useConversation();

  // Individual change logging
  useEffect(() => {
  if (sessionId && fileContent) {
    console.log('📝 Code content changed:', {
      length: fileContent.length,
      code: fileContent
    });
  }
  }, [fileContent]);

  useEffect(() => {
    if (executionOutput) {
      console.log('🏃 Execution output changed:', executionOutput);
    }
  }, [executionOutput]);

  useEffect(() => {
    if (errorContent) {
      console.log('❌ Error content changed:', errorContent);
    }
  }, [errorContent]);

  useEffect(() => {
    if (highlightedText) {
      console.log('🔍 Highlighted text changed:', highlightedText);
    }
  }, [highlightedText]);

  useEffect(() => {
    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      console.log('💬 New conversation message:', {
        role: lastMessage.role,
        content: lastMessage.content,
        totalMessages: conversationHistory.length
      });
    }
  }, [conversationHistory.length]);

  useEffect(() => {
    if (activeMethodId) {
      console.log('📋 Active method changed:', {
        methodId: activeMethodId,
        taskIndex: currentMethodIndex
      });
    }
  }, [activeMethodId, currentMethodIndex]);

  // Show full context when method changes (after data is loaded)
  useEffect(() => {
    if (sessionData && activeMethodId && sessionId) {
      console.log('🔄 Method changed - Full context dump:');
      getContextAndLog();
    }
  }, [activeMethodId, sessionData]);

  // Build complete context object for Sophia
  const buildSophiaContext = (): SophiaContext => {
    const currentTask = sessionData?.tasks[currentMethodIndex];
    const methodTemplate = sessionData?.methodTemplates[activeMethodId] || '';
    
    const context: SophiaContext = {
      currentTask: {
        title: currentTask?.title || '',
        methodId: activeMethodId || '',
        index: currentMethodIndex || 0,
        description: currentTask?.description || '',
        examples: currentTask?.examples || [],
      },
      code: {
        current: fileContent || '',
        highlighted: highlightedText || undefined,
      },
      execution: {
        output: executionOutput || '',
        errors: errorContent || '',
      },
      methodTemplate: methodTemplate,
      testCases: currentTestCases || [],
      conversationHistory: conversationHistory.map((msg: ConversationMessage) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
      })),
      sessionId: sessionId || '',
      lessonId: lessonId || '',
    };

    return context;
  };

  // Build ElevenLabs dynamic variables object
  const buildElevenLabsDynamicVariables = () => {
    const currentTask = sessionData?.tasks[currentMethodIndex];
    const methodTemplate = sessionData?.methodTemplates[activeMethodId] || '';
    
    // Format examples as readable text
    const formatExamples = (examples: any[]) => {
      if (!examples || examples.length === 0) return 'No examples available';
      
      return examples.map((example, index) => 
        `Example ${index + 1}:\nInput: ${JSON.stringify(example.input)}\nOutput: ${example.output}\nExplanation: Shows ${activeMethodId} algorithm behavior`
      ).join('\n\n');
    };

    // Format test cases summary
    const formatTestCasesSummary = (testCases: any[]) => {
      if (!testCases || testCases.length === 0) return 'No test cases available';
      
      return `Testing ${testCases.length} scenarios including different graph sizes and edge configurations`;
    };

    // Format conversation history
    const formatConversationHistory = (messages: any[]) => {
      if (!messages || messages.length === 0) return 'No previous conversation';
      
      return messages.map(msg => {
        const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const role = msg.role === 'user' ? 'Student' : 'Sophia';
        return `[${time}] ${role}: ${msg.content}`;
      }).join('\n');
    };

    const addLineNumbers = (code: string) => {
      return code.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
    };

    const dynamicVariables = {
      // Core context
      current_task_title: currentTask?.title || '',
      task_description: currentTask?.description || '',
      method_id: activeMethodId || '',
      
      // Code context
      template_code: addLineNumbers(methodTemplate),
      student_code: addLineNumbers(fileContent || ''),
      
      // Always include these with fallbacks
      highlighted_code: highlightedText || 'No code currently selected',
      execution_output: executionOutput || 'No recent test execution',
      error_details: errorContent || 'No current errors',
      
      // Educational context
      task_examples: formatExamples(currentTask?.examples || []),
      test_cases_summary: formatTestCasesSummary(currentTestCases || []),
      
      // Conversation context
      conversation_history: formatConversationHistory(conversationHistory),
      conversation_count: conversationHistory.length,
    };

    return dynamicVariables;
  };

  // Get context and log it
  const getContextAndLog = (): SophiaContext => {
    const context = buildSophiaContext();
    
    console.log('🤖 Sophia Context:', {
      currentTask: context.currentTask,
      codeLength: context.code.current.length,
      hasHighlightedText: !!context.code.highlighted,
      hasExecutionOutput: !!context.execution.output,
      hasErrors: !!context.execution.errors,
      testCasesCount: context.testCases.length,
      conversationLength: context.conversationHistory.length,
      sessionId: context.sessionId,
      lessonId: context.lessonId,
    });
    
    console.log('📝 Full Context Details:', context);
    
    return context;
  };

  return {
    buildSophiaContext,
    buildElevenLabsDynamicVariables,
    getContextAndLog,
  };
};