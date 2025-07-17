import { useState, useEffect } from 'react';

import { usePathname } from 'next/navigation';

import { UseSessionUrlReturn } from './types'

export const useSessionUrl = (): UseSessionUrlReturn => {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');

  // Extract lesson ID and session ID from URL
  useEffect(() => {
    // Match pattern: /concepts/[lessonId]/session/[sessionId]
    const urlMatch = pathname?.match(/\/concepts\/([^\/]+)\/session\/([^\/]+)/);
    
    if (urlMatch) {
      const [, newLessonId, newSessionId] = urlMatch;
      
      if (newLessonId !== lessonId || newSessionId !== sessionId) {
        console.log("URL changed - Lesson ID:", newLessonId, "Session ID:", newSessionId);
        setLessonId(newLessonId);
        setSessionId(newSessionId);
      }
    }
  }, [pathname, lessonId, sessionId]);

  return { sessionId, lessonId };
};