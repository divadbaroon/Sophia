export interface UseCodeSnapshotsReturn {
  initialMethodsCode: Record<string, string>;
  isLoading: boolean;
}

export interface UseAutoSaveProps {
  activeMethodId: string | undefined
  sessionId: string | undefined
  lessonId: string | undefined
  currentMethodIndex: number | undefined
}