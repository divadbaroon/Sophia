import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuthStatus, createAnonymousUser } from '@/lib/actions/user';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { user, isAuthenticated } = await checkAuthStatus();
      
      if (isAuthenticated && user) {
        setUser(user);
        setIsAuthenticated(true);
      } else {
        setShowDialog(true);
      }
    };

    checkAuth();
  }, []);

  const handleCreateAccount = async (firstName: string, lastName: string) => {
    try {
      const { user, error } = await createAnonymousUser(firstName, lastName);
      
      if (error) {
        console.error('Error creating account:', error);
        return;
      }
      
      if (user) {
        setShowDialog(false);  
        setUser(user);
        setIsAuthenticated(true);
        router.refresh();  
      }
    } catch (err) {
      console.error('Error in handleCreateAccount:', err);
    }
  };

  const handleContinueWithExisting = () => {
    setIsAuthenticated(true);
    setShowDialog(false);
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