import { createClient } from '@/utils/supabase/client'

import { TestRunResults } from "@/types"

// Save detailed test case results for analytics
export async function saveTestCaseResults(results: TestRunResults) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    // Prepare batch insert data with timestamps
    const insertData = results.testCaseResults.map(testCase => ({
      profile_id: user.id,
      session_id: results.sessionId,
      lesson_id: results.lessonId,
      task_index: results.taskIndex,
      method_id: results.methodId,
      test_case_index: testCase.testCaseIndex,
      test_input: testCase.testInput,
      expected_output: testCase.expectedOutput,
      actual_output: testCase.actualOutput,
      passed: testCase.passed,
      error_message: testCase.errorMessage,
      execution_time_ms: testCase.executionTimeMs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('test_case_results')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error saving test case results:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Saved ${insertData.length} test case results to database`)
    return { success: true, data }
  } catch (error) {
    console.error('Error in saveTestCaseResults:', error)
    return { success: false, error: "Failed to save test case results" }
  }
}

