import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { checkAuthStatus, createAnonymousUser } from '@/lib/actions/user';
import { createStudentSession } from '@/lib/actions/studentsActions';
import { User } from '@/types';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  showDialog: boolean;
  handleCreateAccount: (firstName: string, lastName: string) => Promise<void>;
  handleContinueWithExisting: () => void;
  handleCreateNew: () => void;
  closeDialog: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const router = useRouter();
  const sessionId = 5
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { user, isAuthenticated } = await checkAuthStatus();
      
      if (isAuthenticated && user) {
        setUser(user);
        setIsAuthenticated(true);
        
        // If we have a session ID and user, create session record
        if (sessionId) {
          try {
            await createStudentSession({
              studentId: user.id,
              sessionId: sessionId,
              joinedAt: new Date().toISOString()
            });
          } catch (error) {
            console.error('Error creating student session:', error);
          }
        }
      } else {
        setShowDialog(true);
      }
    };

    checkAuth();
  }, [sessionId]);

  const handleCreateAccount = async (firstName: string, lastName: string) => {
    try {
      console.log("Creating account for:", firstName, lastName);
      const { user, error } = await createAnonymousUser(firstName, lastName);
      
      if (error) {
        console.error('Error creating account:', error);
        return;
      }
      
      if (user) {
        console.log("User created successfully:", user);
        console.log("Current session ID:", sessionId);
        setShowDialog(false);  
        setUser(user);
        setIsAuthenticated(true);
        
        // If we have a session ID, create session record
        if (sessionId) {
          console.log("About to create student session with ID:", sessionId, "for user ID:", user.id);
          try {
            const sessionParams = {
              studentId: user.id,
              sessionId: 5,
              joinedAt: new Date().toISOString()
            };
            console.log("Session params:", sessionParams);
            
            const result = await createStudentSession(sessionParams);
            console.log("Result from createStudentSession:", result);
            
            if (result && result.error) {
              console.error("Error returned from createStudentSession:", result.error);
            } else if (result && result.success) {
              console.log("Student session created successfully:", result.data);
            } else {
              console.warn("Unexpected result format from createStudentSession:", result);
            }
          } catch (error) {
            console.error('Exception in createStudentSession:', error);
          }
        } else {
          console.warn("No sessionId found in URL parameters");
        }
        
        router.refresh();  
      }
    } catch (err) {
      console.error('Error in handleCreateAccount:', err);
    }
  };

  const handleContinueWithExisting = () => {
    setIsAuthenticated(true);
    setShowDialog(false);
    
    // If we have a session ID and user, create session record
    if (sessionId && user) {
      createStudentSession({
        studentId: user.id,
        sessionId: sessionId,
        joinedAt: new Date().toISOString()
      }).catch(error => {
        console.error('Error creating student session:', error);
      });
    }
    
    router.refresh();
  };

  const handleCreateNew = () => {
    setUser(null);
  };

  const closeDialog = () => setShowDialog(false);

  return {
    isAuthenticated,
    user,
    showDialog,
    handleCreateAccount,
    handleContinueWithExisting,
    handleCreateNew,
    closeDialog
  };
};