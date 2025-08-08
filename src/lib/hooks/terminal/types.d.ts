export interface ParsedTestResults {
  passedCount: number
  totalCount: number
  detailedResults: TestCaseResult[]
  isError: boolean
  isSuccess: boolean
}