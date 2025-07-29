import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, TrendingUp, Users, RefreshCw } from "lucide-react";
import { Session } from "@/types";

interface OverallReportProps {
  sessions: Session[];
  currentPrompt?: string;
}

interface ReportData {
  overview: string;
  specificIssues: Array<{
    sessionName: string;
    issue: string;
    criteriaFailed: string;
  }>;
  recommendations: string[];
}

export function OverallReport({ sessions, currentPrompt }: OverallReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate real metrics from sessions data
  const calculateMetrics = () => {
    const completedSessions = sessions.filter(session => session.status === "completed");
    const totalSessions = sessions.length;
    
    if (completedSessions.length === 0) {
      return {
        overallSuccessRate: 0,
        totalCriteriaPassed: 0,
        totalCriteriaEvaluated: 0,
        completedSessions: 0,
        totalSessions
      };
    }

    // Aggregate all evaluation criteria results across sessions
    let totalPassed = 0;
    let totalEvaluated = 0;

    completedSessions.forEach(session => {
      if (session.simulationResult?.analysis?.evaluationCriteriaResults) {
        const results = Object.values(session.simulationResult.analysis.evaluationCriteriaResults);
        totalEvaluated += results.length;
        totalPassed += results.filter(result => result.result === "success").length;
      }
    });

    const overallSuccessRate = totalEvaluated > 0 ? Math.round((totalPassed / totalEvaluated) * 100) : 0;

    return {
      overallSuccessRate,
      totalCriteriaPassed: totalPassed,
      totalCriteriaEvaluated: totalEvaluated,
      completedSessions: completedSessions.length,
      totalSessions
    };
  };

  const performanceMetrics = calculateMetrics();
  const hasCompletedSessions = performanceMetrics.completedSessions > 0;

  // Generate report from API
  const generateReport = async () => {
    if (!hasCompletedSessions) return;

    if (!currentPrompt) {
      setError('Current prompt is required to generate recommendations');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🚀 Generating report for', performanceMetrics.completedSessions, 'sessions');
      
      const response = await fetch('/api/claude/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessions: sessions,
          currentPrompt: currentPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
      console.log('✅ Report generated successfully');

    } catch (error) {
      console.error('❌ Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate report when completed sessions change
  useEffect(() => {
    if (hasCompletedSessions && !reportData && !isGenerating) {
      generateReport();
    }
  }, [hasCompletedSessions, performanceMetrics.completedSessions]);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
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
                {hasCompletedSessions ? (
                  <div className={`w-3 h-3 rounded-full ${
                    performanceMetrics.overallSuccessRate >= 80 ? 'bg-green-500' :
                    performanceMetrics.overallSuccessRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                )}
              </div>
              {hasCompletedSessions ? (
                <>
                  <div className={`text-3xl font-bold ${getPerformanceColor(performanceMetrics.overallSuccessRate)}`}>
                    {performanceMetrics.overallSuccessRate}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {performanceMetrics.totalCriteriaPassed}/{performanceMetrics.totalCriteriaEvaluated} criteria passed
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-400">
                    N/A
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Run simulations to populate
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Overview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Overview</h4>
              {hasCompletedSessions && (
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </Button>
              )}
            </div>
            
            {!hasCompletedSessions ? (
              <p className="text-gray-500 italic">Run simulations to generate analysis</p>
            ) : isGenerating ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Analyzing sessions with Claude...</span>
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm">
                Error: {error}
                <Button
                  onClick={generateReport}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  Retry
                </Button>
              </div>
            ) : reportData ? (
              <p className="text-gray-700 leading-relaxed">{reportData.overview}</p>
            ) : (
              <p className="text-gray-500 italic">Click "Generate" to analyze sessions</p>
            )}
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
          {!hasCompletedSessions ? (
            <p className="text-gray-500 italic text-center py-8">
              Run simulations to identify specific issues
            </p>
          ) : isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Analyzing issues...</span>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-8">
              Failed to load issues. Click "Regenerate" above to try again.
            </p>
          ) : reportData?.specificIssues && reportData.specificIssues.length > 0 ? (
            <div className="space-y-4">
              {reportData.specificIssues.map((issue, index) => (
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
          ) : reportData ? (
            <p className="text-green-600 text-center py-8 font-medium">
              🎉 No issues found! All evaluation criteria passed successfully.
            </p>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No specific issues found in the analysis.
            </p>
          )}
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
          {!hasCompletedSessions ? (
            <p className="text-gray-500 italic text-center py-8">
              Run simulations to generate recommendations
            </p>
          ) : isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Generating recommendations...</span>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-8">
              Failed to load recommendations. Click "Regenerate" above to try again.
            </p>
          ) : reportData?.recommendations ? (
            <div className="space-y-3">
              {reportData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No recommendations available in the analysis.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}