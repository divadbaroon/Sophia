export interface UseTaskNavigationReturn {
  currentMethodIndex: number;
  activeMethodId: string;
  currentTestCases: TestCase[];
  setCurrentMethodIndex: (index: number) => void;
  goToNextMethod: () => void;
  goToPrevMethod: () => void;
}
