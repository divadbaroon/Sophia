import { useState, useEffect } from 'react';

import { UseTaskNavigationReturn } from './types'
import { TestCase } from '@/types';

export const useTaskNavigation = (
  sessionData: any,
): UseTaskNavigationReturn => {
  const [currentMethodIndex, setCurrentMethodIndex] = useState<number>(0);
  const [activeMethodId, setActiveMethodId] = useState<string>('');
  const [currentTestCases, setCurrentTestCases] = useState<TestCase[]>([]);

  // Update active method ID and test cases when method index or session changes
  useEffect(() => {
    if (sessionData?.tasks && sessionData.tasks[currentMethodIndex]) {
      const currentTask = sessionData.tasks[currentMethodIndex];
      const methodId = currentTask.method_name;
      
      if (methodId) {
        console.log("✅ Found methodId:", methodId);
        setActiveMethodId(methodId);
        
        if (sessionData.testCases[methodId]) {
          setCurrentTestCases(sessionData.testCases[methodId]);
        } else {
          setCurrentTestCases([]);
        }
      } else {
        console.error("❌ No method_name found in task:", currentTask);
        setActiveMethodId('');
        setCurrentTestCases([]);
      }
    }
  }, [currentMethodIndex, sessionData]);

  // Navigation methods
  const goToNextMethod = () => {
    if (sessionData && currentMethodIndex < sessionData.tasks.length - 1) {
      setCurrentMethodIndex(currentMethodIndex + 1);
    }
  };
  
  const goToPrevMethod = () => {
    if (currentMethodIndex > 0) {
      setCurrentMethodIndex(currentMethodIndex - 1);
    }
  };

  return {
    currentMethodIndex,
    activeMethodId,
    currentTestCases,
    setCurrentMethodIndex,
    goToNextMethod,
    goToPrevMethod,
  };
};