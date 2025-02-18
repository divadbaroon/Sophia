import { useEffect } from 'react';
import { useDeepgram } from './DeepgramContextProvider';

interface DeepgramInitializerProps {
  children: React.ReactNode;
}

export function DeepgramInitializer({ children }: DeepgramInitializerProps) {
  const { setDeepgramKey } = useDeepgram();

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (apiKey) {
      setDeepgramKey(apiKey);
    }
  }, [setDeepgramKey]);

  return <>{children}</>;
}