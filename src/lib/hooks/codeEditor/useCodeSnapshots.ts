import { useState, useEffect } from 'react';

import { loadAllCodeSnapshots } from '@/lib/actions/code-snapshot-actions';

import { UseCodeSnapshotsReturn } from "./types" 

export const useCodeSnapshots = (
  sessionData: any, 
  sessionId: string | null, 
  lessonId: string | null
): UseCodeSnapshotsReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialMethodsCode, setInitialMethodsCode] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadCodeSnapshots = async () => {
      // Early exit if we don't have required data
      if (!sessionData?.methodTemplates || !sessionId || !lessonId) {
        setIsLoading(false);
        return;
      }
      
      console.log("Loading code snapshots for session", sessionId);
      setIsLoading(true);
      
      try {
        // 1. Start with template code for all methods
        const methodsCode = { ...sessionData.methodTemplates };
        
        // 2. Try to load saved code from database
        const result = await loadAllCodeSnapshots(sessionId, lessonId);
        
        if (result.success && result.methodsCode) {
          console.log("Found saved code in database for session", sessionId);
          
          // 3. Merge: saved code overrides templates
          Object.keys(sessionData.methodTemplates).forEach(methodId => {
            if (result.methodsCode![methodId]) {
              methodsCode[methodId] = result.methodsCode![methodId];
            }
          });
          
          console.log("Using saved code from database");
        } else {
          console.log("No saved code found, using templates");
        }
        
        // 4. Set the loaded code (ONCE)
        setInitialMethodsCode(methodsCode);
        
        console.log("Code snapshots loaded successfully");
      } catch (error) {
        console.error("Error loading code snapshots:", error);
        // Fallback to templates only
        setInitialMethodsCode({ ...sessionData.methodTemplates });
      } finally {
        setIsLoading(false);
      }
    };

    loadCodeSnapshots();
  }, [sessionData, sessionId, lessonId]);

  return { initialMethodsCode, isLoading };
};