export interface UseTaskProgressReturn {
  completedTasks: Set<number>
  isTaskCompleted: (taskIndex: number) => boolean
  isLoading: boolean
  error: string | null
  refreshTaskProgress: () => Promise<void>
}