export interface Judge0SubmissionResult {
  stdout?: string
  stderr?: string
  status_id: number
  compile_output?: string
  message?: string
}

export interface Judge0Config {
  apiUrl: string
  apiKey: string
  javaLanguageId: number
}
