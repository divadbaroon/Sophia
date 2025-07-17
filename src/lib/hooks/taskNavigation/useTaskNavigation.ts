import { useState, useEffect } from 'react';

import { UseTaskNavigationReturn } from './types'
import { TestCase } from '@/types';

export const useTaskNavigation = (
  sessionData: any,
): UseTaskNavigationReturn => {
  const [currentMethodIndex, setCurrentMethodIndex] = useState<number>(0);
  const [activeMethodId, setActiveMethodId] = useState<string>('');
  const [currentTestCases, setCurrentTestCases] = useState<TestCase[]>([]);

  // Helper function to extract method ID from title
  const extractMethodIdFromTitle = (title: string): string | null => {
    const match = title.match(/(?:\d+\.\)\s+)?([a-zA-Z_]+)\(\)/);
    return match ? match[1] : null;
  };

  // Update active method ID and test cases when method index or session changes
  useEffect(() => {
    if (sessionData?.tasks && sessionData.tasks[currentMethodIndex]) {
      const title = sessionData.tasks[currentMethodIndex].title;
      console.log("🔍 Extracting methodId from title:", title);
      
      const methodId = extractMethodIdFromTitle(title);
      
      if (methodId) {
        console.log("✅ Found methodId:", methodId);
        setActiveMethodId(methodId);
        
        if (sessionData.testCases[methodId]) {
          setCurrentTestCases(sessionData.testCases[methodId]);
        } else {
          setCurrentTestCases([]);
        }
      } else {
        console.error("❌ Could not extract methodId from title:", title);
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