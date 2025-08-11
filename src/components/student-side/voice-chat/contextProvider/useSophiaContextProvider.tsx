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

export const useSophiaContext = (sendContextualUpdate?: (message: string) => void) => {
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
    currentSequence,
  } = useCodeEditor();
  
  const { conversationHistory } = useConversation();

  // Visualization helper functions
  const isVisualizationTask = (methodId: string | undefined): boolean => {
    if (!methodId) return false;
    return methodId.includes('visualization');
  };

  const getVisualizationType = (methodId: string | undefined): string => {
    if (!methodId || !isVisualizationTask(methodId)) return 'N/A';
    
    if (methodId.includes('dfs')) return 'dfs';
    if (methodId.includes('hash')) return 'hash';
    if (methodId.includes('tree')) return 'tree';
    return 'N/A';
  };

  const getVisualizationDescription = (methodId: string | undefined): string => {
    const type = getVisualizationType(methodId);
    
    switch (type) {
      case 'dfs':
        return 'Number the nodes in the order that Depth-First Search would visit them, starting from node 1. When finished the user should click "Run Tests" to see how they did.';
      case 'hash':
        return 'Draw where the value 15 should be inserted in the hash table using collision chaining (15 mod 11 = 4). When finished the user should click "Run Tests" to see how they did.';
      case 'tree':
        return 'Number the nodes in postorder traversal order. When finished the user should click "Run Tests" to see how they did.';
      default:
        return 'N/A';
    }
  };

  const getVisualizationLayout = (methodId: string | undefined): string => {
    const type = getVisualizationType(methodId);
    
    switch (type) {
      case 'dfs':
        return 'Graph with nodes 1, 2, 3, 5, 6. Connections: 1→2, 1→3, 2→5, 2→6. Students click/draw on nodes to show visit order.';
      case 'hash':
        return 'Hash table with slots 0-10. Existing chain at slot 1:→12→4, slot 4:→26→4, and slot 7:→18. Students draw where to insert value 15.';
      case 'tree':
        return 'Binary tree with root A, left subtree B(children D,E), right subtree C(child F). Students number nodes in postorder.';
      default:
        return 'N/A';
    }
  };

  const formatStudentSequence = (sequence: (number | string)[]): string => {
    if (!sequence || sequence.length === 0) return 'No interactions yet';
    return sequence.join(' → ');
  };

  const getCorrectAnswer = (methodId: string | undefined): string => {
    const type = getVisualizationType(methodId);
    
    switch (type) {
      case 'dfs':
        return '1 → 2 → 5 → 6 → 3';
      case 'hash':
        return 'Insert 15 before 26 in the chain (slot4Arrow zone, anything other than this is incorrect but dont say the zone verbatim as its code for the connection)';
      case 'tree':
        return 'D(1) → E(2) → B(3) → F(4) → C(5) → A(6)';
      default:
        return 'N/A';
    }
  };

  // Individual change logging
  useEffect(() => {
    if (sessionId && fileContent) {
      console.log('📝 Code content changed:', {
        length: fileContent.length,
        code: fileContent
      });

      // Send contextual update to Sophia (only for coding tasks)
      if (sendContextualUpdate && !isVisualizationTask(activeMethodId)) {
        sendContextualUpdate(`Student just updated their code: ${fileContent}`);
      }
    }
  }, [fileContent, sendContextualUpdate, activeMethodId]);

  useEffect(() => {
    if (executionOutput) {
      console.log('🏃 Execution output changed:', executionOutput);
      
      // Send contextual update to Sophia
      if (sendContextualUpdate) {
        sendContextualUpdate(`Student just ran tests. Results: ${executionOutput}`);
      }
    }
  }, [executionOutput, sendContextualUpdate]);

  useEffect(() => {
    if (errorContent) {
      console.log('❌ Error content changed:', errorContent);
      
      // Send contextual update to Sophia (only for coding tasks)
      if (sendContextualUpdate && !isVisualizationTask(activeMethodId)) {
        sendContextualUpdate(`Student just ran into a new error: ${errorContent}`);
      }
    }
  }, [errorContent, sendContextualUpdate, activeMethodId]);

  useEffect(() => {
    if (highlightedText) {
      console.log('🔍 Highlighted text changed:', highlightedText);
      
      // Send contextual update to Sophia (only for coding tasks)
      if (sendContextualUpdate && !isVisualizationTask(activeMethodId)) {
        sendContextualUpdate(`Student just highlighted new code: ${highlightedText}`);
      }
    }
  }, [highlightedText, sendContextualUpdate, activeMethodId]);

  // NEW: Track visualization interactions
  useEffect(() => {
    if (currentSequence.length > 0 && isVisualizationTask(activeMethodId)) {
      const lastAction = currentSequence[currentSequence.length - 1];
      console.log('🎯 Visualization interaction:', {
        sequence: currentSequence,
        lastAction,
        taskType: getVisualizationType(activeMethodId)
      });
      
      // Send contextual update for visualization
      if (sendContextualUpdate) {
        const visualType = getVisualizationType(activeMethodId);
        sendContextualUpdate(`Student just interacted with ${visualType} visualization. Current sequence: ${formatStudentSequence(currentSequence)}`);
      }
    }
  }, [currentSequence, sendContextualUpdate, activeMethodId]);

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
        taskIndex: currentMethodIndex,
        isVisualization: isVisualizationTask(activeMethodId)
      });
    }
  }, [activeMethodId, currentMethodIndex, sendContextualUpdate, sessionData]);

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
    const isVisualization = isVisualizationTask(activeMethodId);
    
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
      // Core context (always present)
      current_task_title: currentTask?.title || '',
      task_description: currentTask?.description || '',
      method_id: activeMethodId || '',
      
      // Task type
      task_type: isVisualization ? 'visualization' : 'coding',
      
      // Conditional context based on task type
      ...(isVisualization ? {
        // Visualization context
        visualization_type: getVisualizationType(activeMethodId),
        visualization_description: getVisualizationDescription(activeMethodId),
        visualization_layout: getVisualizationLayout(activeMethodId),
        student_sequence: formatStudentSequence(currentSequence),
        correct_answer: getCorrectAnswer(activeMethodId),
        
        // Set coding context to N/A
        template_code: 'N/A - This is a visualization task',
        student_code: 'N/A - This is a visualization task',
        highlighted_code: 'N/A - This is a visualization task',
        execution_output: executionOutput || 'No recent test execution',
        error_details: 'N/A - This is a visualization task',
        task_examples: 'N/A - Visualization tasks use interactive exercises',
        test_cases_summary: 'N/A - Visualization tasks use conceptual validation',
      } : {
        // Coding context
        template_code: addLineNumbers(methodTemplate),
        student_code: addLineNumbers(fileContent || ''),
        highlighted_code: highlightedText || 'No code currently selected',
        execution_output: executionOutput || 'No recent test execution',
        error_details: errorContent || 'No current errors',
        task_examples: formatExamples(currentTask?.examples || []),
        test_cases_summary: formatTestCasesSummary(currentTestCases || []),
        
        // Set visualization context to N/A
        visualization_type: 'N/A - This is a coding task',
        visualization_description: 'N/A - This is a coding task',
        visualization_layout: 'N/A - This is a coding task',
        student_sequence: 'N/A - This is a coding task',
        correct_answer: 'N/A - This is a coding task',
      }),
      
      // Conversation context (always present)
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
      isVisualization: isVisualizationTask(activeMethodId),
      visualizationType: getVisualizationType(activeMethodId),
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