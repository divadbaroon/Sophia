"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Anthropic } from "@anthropic-ai/sdk";
import { getAllStudentConceptMapsForLesson } from "@/lib/actions/student-concept-map-actions";

// Updated interfaces to match database structure
interface ConceptMapEntry {
  understandingLevel: number;
  confidenceInAssessment: number;
  reasoning: string;
  lastUpdated: string;
}

interface DatabaseConceptMap {
  [conceptName: string]: ConceptMapEntry;
}

interface TaskConceptData {
  id: string;
  method_title: string;
  concept_data: DatabaseConceptMap;
  version: number;
  created_at: string;
  updated_at: string;
  coding_tasks: {
    title: string;
    difficulty: string;
  }[];
}

interface RadarDataPoint {
  subject: string;
  value: number;
  category: string;
  fullMark: number;
  knowledgeState: ConceptMapEntry;
}

interface KnowledgeRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  onContinue?: () => void; // Add optional continue callback
}

// Loading screen component
const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8">
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-transparent border-purple-600 dark:border-purple-500 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-2xl font-bold text-center bg-clip-text">
        Generating Report...
      </h2>
    </div>
  );
};

const KnowledgeRadarModal: React.FC<KnowledgeRadarModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  onContinue,
}) => {
  const [loading, setLoading] = useState(true);
  const [conceptMapsData, setConceptMapsData] = useState<TaskConceptData[]>([]);
  const [assessmentOverview, setAssessmentOverview] = useState<string>("");
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load concept maps data from database
  useEffect(() => {
    const loadConceptMaps = async () => {
      if (!lessonId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await getAllStudentConceptMapsForLesson(lessonId);
        
        if (result.error) {
          setError(result.error);
          console.error('Error loading concept maps:', result.error);
        } else if (result.data) {
          setConceptMapsData(result.data);
          console.log('Loaded concept maps:', result.data);
        } else {
          setError('No concept maps found for this lesson');
        }
      } catch (error) {
        console.error('Unexpected error loading concept maps:', error);
        setError('Failed to load concept maps');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && lessonId) {
      loadConceptMaps();
    }
  }, [isOpen, lessonId]);

  // Generate skills assessment overview using Anthropic API
  const generateSkillsAssessment = useCallback(async () => {
    if (conceptMapsData.length === 0) return;
    
    setIsGeneratingOverview(true);

    try {
      // Create Anthropic client 
      const client = new Anthropic({
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "",
        dangerouslyAllowBrowser: true,
      });

      // Combine all concept maps into a comprehensive assessment
      const allConcepts = conceptMapsData.flatMap(task => 
        Object.entries(task.concept_data).map(([conceptName, conceptData]) => ({
          task: task.method_title,
          concept: conceptName,
          ...conceptData
        }))
      );

      const prompt = `
I need you to analyze a student's programming knowledge based on their concept map data across multiple tasks.

Keep your analysis concise while still giving a very solid overview of the student's strengths and weaknesses

CONCEPT MAP DATA:
${JSON.stringify(allConcepts, null, 2)}

IMPORTANT: FOCUS ON CONCEPTS THAT HAVE HIGH CONFIDENCE (.7 and above) IN YOUR ASSESSMENT

Please generate a very concise Skills Assessment Overview that includes:
1. A comprehensive analysis of the student's current proficiency based on the concept map data
2. Identification of areas of strength (concepts with understanding levels > 0.6)
3. Identification of development areas (concepts with understanding levels < 0.4)
4. Specific, actionable advice for improvement
5. A brief summary of overall progress and potential

Do not include "Skills Assessment Overview" as a title in your response.

Make your response intuitive and encouraging to the student.

Format the response as HTML with paragraphs (<p>) and potentially lists if needed, but keep it concise, actionable, and encouraging.
The total response should be around 1 paragraph.
`;

      const response = await client.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      if (response.content && response.content.length > 0) {
        const contentBlock = response.content[0];
        if (contentBlock.type === "text") {
          setAssessmentOverview(contentBlock.text);
        } else {
          setAssessmentOverview(
            "<p>Unable to generate a personalized assessment. Please review the detailed breakdown below.</p>"
          );
        }
      }
    } catch (error) {
      console.error("Error generating skills assessment:", error);
      setAssessmentOverview(
        "<p>Unable to generate a personalized skills assessment at this time. Please review the detailed breakdown below for specific feedback on each concept.</p>"
      );
    } finally {
      setIsGeneratingOverview(false);
    }
  }, [conceptMapsData]);

  // Generate the assessment when the component is ready
  useEffect(() => {
    if (!loading && conceptMapsData.length > 0 && !assessmentOverview) {
      generateSkillsAssessment();
    }
  }, [loading, conceptMapsData, assessmentOverview, generateSkillsAssessment]);

  if (!isOpen) return null;

  // Handle closing modal - use continue function if available, otherwise use onClose
  const handleClose = () => {
    if (onContinue) {
      onContinue();
    } else {
      onClose();
    }
  };

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Transform database data for radar charts
  const transformDataForRadar = () => {
    const radarData: RadarDataPoint[] = [];
    const categoryAverages: { [taskName: string]: { sum: number; count: number } } = {};

    // Process each task's concept map
    conceptMapsData.forEach(task => {
      const taskInfo = task.coding_tasks[0]; // Get the first (and should be only) task
      const taskTitle = taskInfo?.title || task.method_title;
      
      Object.entries(task.concept_data).forEach(([conceptName, conceptData]) => {
        // Only include concepts with confidence above 0.6
        if (conceptData.confidenceInAssessment > 0.6) {
          // Add to radar data
          radarData.push({
            subject: conceptName,
            value: Number.parseFloat((conceptData.understandingLevel * 100).toFixed(1)),
            category: taskTitle,
            fullMark: 100,
            knowledgeState: conceptData,
          });

          // Calculate category averages
          if (!categoryAverages[taskTitle]) {
            categoryAverages[taskTitle] = { sum: 0, count: 0 };
          }
          categoryAverages[taskTitle].sum += conceptData.understandingLevel;
          categoryAverages[taskTitle].count += 1;
        }
      });
    });

    // Convert category averages to chart format
    const categoryChartData = Object.entries(categoryAverages).map(([taskName, data]) => ({
      subject: taskName,
      value: Number.parseFloat(((data.sum / data.count) * 100).toFixed(1)),
      fullMark: 100,
    }));

    return { radarData, categoryChartData };
  };

  // Helper functions for skill levels and colors
  type SkillLevel = "Beginner" | "Basic" | "Intermediate" | "Advanced";

  const getSkillLevel = (value: number): SkillLevel => {
    if (value > 75) return "Advanced";
    if (value > 50) return "Intermediate";
    if (value > 25) return "Basic";
    return "Beginner";
  };

  const getLevelColor = (value: number): string => {
    if (value > 75) return "bg-emerald-500";
    if (value > 50) return "bg-blue-500";
    if (value > 25) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getLevelTextColor = (value: number): string => {
    if (value > 75) return "text-emerald-500";
    if (value > 50) return "text-blue-500";
    if (value > 25) return "text-amber-500";
    return "text-rose-500";
  };

  const getLevelBgColor = (value: number): string => {
    if (value > 75) return "bg-emerald-50 dark:bg-emerald-900/20";
    if (value > 50) return "bg-blue-50 dark:bg-blue-900/20";
    if (value > 25) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-rose-50 dark:bg-rose-900/20";
  };

  const getLevelBorderColor = (value: number): string => {
    if (value > 75) return "border-emerald-200 dark:border-emerald-800";
    if (value > 50) return "border-blue-200 dark:border-blue-800";
    if (value > 25) return "border-amber-200 dark:border-amber-800";
    return "border-rose-200 dark:border-rose-800";
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] relative border border-gray-200 dark:border-gray-800">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative border border-gray-200 dark:border-gray-800">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center py-8">
            <div className="text-rose-500 mb-4">
              <X className="h-16 w-16" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Error Loading Report</h2>
            <p className="text-gray-500 text-center">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (conceptMapsData.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative border border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center py-8">
            <div className="text-gray-400 mb-4">
              <X className="h-16 w-16" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
            <p className="text-gray-500 text-center">
              No concept maps found for this lesson. Complete some tasks to see your progress!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { radarData } = transformDataForRadar();

  // Sort skills for development areas - only from filtered data
  const developmentAreas = [...radarData]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  const detailedConfig = {
    proficiency: {
      label: "Skill Proficiency",
      color: "hsl(260, 70%, 60%)",
    },
  } as ChartConfig;

  // Custom tooltip component
  const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{ value?: number; dataKey?: string }>;
  }> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-proficiency)]" />
            <span className="text-sm font-medium">Proficiency</span>
          </div>
          <div className="text-right text-sm font-medium">
            {`${payload[0]?.value || 0}%`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative border border-gray-200 dark:border-gray-800">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex flex-col items-center mb-6 space-y-2">
            <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Student Knowledge Assessment
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-center">
              A comprehensive analysis of your programming skills and learning progress
            </p>
          </div>

          {/* Full Width Radar Chart */}
          <Card className="shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800 mb-6">
            <CardHeader className="items-center pb-4">
              <CardTitle className="text-xl text-center">
                Detailed Concept Assessment
              </CardTitle>
              <CardDescription>
                Your personalized proficiency levels
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <ChartContainer
                config={detailedConfig}
                className="mx-auto w-full max-h-[500px]"
              >
                <RadarChart data={radarData} width={800} height={500}>
                  <ChartTooltip
                    cursor={false}
                    content={<CustomTooltip />}
                    trigger="click"
                  />
                  <PolarGrid className="fill-[--color-proficiency] opacity-20" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "currentColor", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "currentColor", fontSize: 10 }}
                  />
                  <Radar
                    dataKey="value"
                    name="Skill Proficiency"
                    fill="var(--color-proficiency)"
                    fillOpacity={0.6}
                    stroke="var(--color-proficiency)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: "var(--color-proficiency)",
                      cursor: "pointer",
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 1,
                      stroke: "#fff",
                    }}
                  />
                </RadarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                last updated: {new Date().toLocaleDateString()}
              </div>
            </CardFooter>
          </Card>

          {/* Text Overview Section */}
          <Card className="shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                Skills Assessment Overview
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of current proficiency and learning path
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 prose dark:prose-invert max-w-none">
                {isGeneratingOverview ? (
                  <div className="flex flex-col items-center py-4">
                    <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Generating personalized assessment...</p>
                  </div>
                ) : assessmentOverview ? (
                  <div dangerouslySetInnerHTML={{ __html: assessmentOverview }} />
                ) : (
                  <>
                    <p>
                      Based on your concept map data across {conceptMapsData.length} tasks, 
                      you show varying levels of understanding across different programming concepts. 
                      Review the detailed breakdown below for specific feedback on each concept.
                    </p>
                    <p className="font-medium">
                      Your progress shows promise across multiple areas. Focusing on the highlighted
                      development areas will help solidify your understanding and boost your overall proficiency.
                    </p>
                  </>
                )}
              </div>

              {developmentAreas.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">
                    Areas that need further focus
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {developmentAreas.map((skill, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getLevelBorderColor(
                          skill.value
                        )} ${getLevelBgColor(skill.value)} flex flex-col justify-between h-full`}
                      >
                        <span className="font-medium text-sm">
                          {skill.subject}
                        </span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{skill.category}</span>
                          <span
                            className={`${getLevelTextColor(
                              skill.value
                            )} font-bold`}
                          >
                            {skill.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skill Breakdown Table - Only show high confidence concepts */}
          <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
            <CardHeader className="items-center pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                High-Confidence Concept Breakdown
              </CardTitle>
              <CardDescription>
                Detailed view of concepts with system confidence above 60%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                        Task
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                        Concept
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                        Proficiency
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                        Level
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                        System Confidence
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                        Reasoning
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {radarData.map((item, index) => {
                      const level = getSkillLevel(item.value);
                      const levelColor = getLevelColor(item.value);
                      const textColor = getLevelTextColor(item.value);
                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="border border-gray-200 dark:border-gray-700 p-2">
                            {item.category}
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 p-2">
                            {item.subject}
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 p-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${levelColor}`}
                                style={{ width: `${item.value}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 p-2">
                            <Badge
                              className={`${textColor
                                .replace("text-", "bg-")
                                .replace("500", "100")} ${textColor}`}
                            >
                              {level}
                            </Badge>
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 p-2">
                            {Math.round(item.knowledgeState.confidenceInAssessment * 100)}%
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 p-2 max-w-xs">
                            <div className="truncate" title={item.knowledgeState.reasoning}>
                              {item.knowledgeState.reasoning}
                            </div>
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 p-2">
                            {new Date(item.knowledgeState.lastUpdated).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Proficiency Level Guide */}
          <Card className="mt-6 shadow-md border border-gray-200 dark:border-gray-800">
            <CardHeader className="items-center pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                Proficiency Level Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { color: "bg-rose-500", range: "0-25%: Beginner" },
                  { color: "bg-amber-500", range: "26-50%: Basic" },
                  { color: "bg-blue-500", range: "51-75%: Intermediate" },
                  { color: "bg-emerald-500", range: "76-100%: Advanced" }
                ].map((level, index) => (
                  <div key={index} className="flex items-center p-3 rounded-lg">
                    <div className={`w-4 h-4 ${level.color} rounded-full mr-2`}></div>
                    <span>{level.range}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Continue Button - Only show if onContinue is provided */}
          {onContinue && (
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={onContinue}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Continue to Survey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeRadarModal;