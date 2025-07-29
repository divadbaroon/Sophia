import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, TrendingUp, Users } from "lucide-react";

export function OverallReport() {
  // Hardcoded data for now
  const performanceMetrics = {
    overallSuccessRate: 73,
    totalCriteriaPassed: 8,
    totalCriteriaEvaluated: 11,
    totalSessions: 3,
    completedSessions: 3,
    difficultyBreakdown: {
      beginner: { rate: 90, sessions: 1 },
      intermediate: { rate: 67, sessions: 1 },  
      advanced: { rate: 45, sessions: 1 }
    }
  };

  const agentAnalysis = `The teaching agent demonstrates strong foundational knowledge delivery and excels at providing clear initial explanations. However, it struggles with adaptive questioning when students express confusion and tends to maintain the same complexity level regardless of student feedback. The agent performs best with beginner-level students where straightforward explanations are sufficient, but shows declining effectiveness as student complexity increases.`;

  const specificIssues = [
    {
      sessionName: "Simulated Student 2 (Advanced BST)",
      issue: "Failed to simplify explanation when student expressed confusion about time complexity",
      criteriaFailed: "Teaching Effectiveness"
    },
    {
      sessionName: "Simulated Student 1 (Intermediate Traversal)", 
      issue: "Didn't provide visual examples when student specifically requested diagram assistance",
      criteriaFailed: "Student Engagement"
    },
    {
      sessionName: "Simulated Student 2 (Advanced BST)",
      issue: "Used technical jargon without checking student comprehension level",
      criteriaFailed: "Clarity of Communication"
    }
  ];

  const recommendations = [
    "Implement confusion detection patterns to trigger explanation simplification when students use phrases like 'I'm lost' or 'I don't understand'",
    "Add visual/diagram generation capabilities specifically for tree data structure concepts",
    "Create dynamic vocabulary adjustment based on student difficulty level and comprehension signals",
    "Develop follow-up question strategies to verify understanding before moving to next concepts"
  ];

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBgColor = (rate: number) => {
    if (rate >= 80) return "bg-green-100";
    if (rate >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Sessions Completed */}
            <div className="p-6 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Sessions Completed</span>
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-3xl font-bold text-gray-700">
                {performanceMetrics.completedSessions}/{performanceMetrics.totalSessions}
              </div>
              <div className="text-sm text-gray-500 mt-1">simulation sessions</div>
            </div>

            {/* Overall Success Rate */}
            <div className="p-6 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Overall Success Rate</span>
                <div className={`w-3 h-3 rounded-full ${
                  performanceMetrics.overallSuccessRate >= 80 ? 'bg-green-500' :
                  performanceMetrics.overallSuccessRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className={`text-3xl font-bold ${getPerformanceColor(performanceMetrics.overallSuccessRate)}`}>
                {performanceMetrics.overallSuccessRate}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {performanceMetrics.totalCriteriaPassed}/{performanceMetrics.totalCriteriaEvaluated} criteria passed
              </div>
            </div>
          </div>

          {/* Overview - moved under the cards */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Overview</h4>
            <p className="text-gray-700 leading-relaxed">{agentAnalysis}</p>
          </div>
        </CardContent>
      </Card>

      {/* Specific Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Specific Issues Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {specificIssues.map((issue, index) => (
              <div key={index} className="border-l-4 border-red-300 pl-4 py-2">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900">{issue.sessionName}</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                    {issue.criteriaFailed}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{issue.issue}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            Recommended Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}