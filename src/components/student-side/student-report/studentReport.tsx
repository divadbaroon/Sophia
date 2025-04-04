"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
import { ConversationMessage } from "@/types";
import { Anthropic } from "@anthropic-ai/sdk";

// Define the missing RadarDataPoint interface
interface RadarDataPoint {
  subject: string;
  value: number;
  category: string;
  fullMark: number;
  knowledgeState: {
    understandingLevel: number;
    confidenceInAssessment: number;
    reasoning: string;
    lastUpdated: string;
  };
}

// Define the interface for subcategory structure
interface Subcategory {
  name: string;
  value: number;
  knowledgeState: {
    understandingLevel: number;
    confidenceInAssessment: number;
    reasoning: string;
    lastUpdated: string;
  };
}

// Define the interface for category structure
interface Categories {
  [categoryName: string]: {
    [skillKey: string]: Subcategory;
  };
}

// Define the interface for concept map
interface ConceptMap {
  categories: Categories;
}

// Modal props interface (systemType removed)
interface KnowledgeRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentTask: string;
  code: string;
  conversationHistory: ConversationMessage[];
  conceptMap: ConceptMap;
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
  studentTask,
  code,
  conversationHistory,
  conceptMap,
}) => {
  const [loading, setLoading] = useState(true);
  const [assessmentOverview, setAssessmentOverview] = useState<string>("");
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);

  useEffect(() => {
    // Simulate data processing time before showing the report
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Generate skills assessment overview using Anthropic API
  const generateSkillsAssessment = async () => {
    setIsGeneratingOverview(true);

    try {
      // Create Anthropic client 
      const client = new Anthropic({
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "",
        dangerouslyAllowBrowser: true, // For client-side usage
      });

      // Use the detailed prompt with concept map data
      const prompt = `
          I need you to analyze a student's programming knowledge based on their concept map data.
          
          CONCEPT MAP DATA:
          ${JSON.stringify(conceptMap, null, 2)}

          IMPORTANT: FOCUS ON CONCEPTS THAT YOU HAVE A HIGH CONFIDENCE ( .7 and above) IN YOUR ASSESMENT
             
          Please generate a very concise Skills Assessment Overview that includes:
          1. A comprehensive analysis of the student's current proficiency based on the concept map data
          2. Identification of areas of strength (concepts with values > 0.6)
          3. Identification of development areas (concepts with values < 0.4)
          4. Specific, actionable advice for improvement
          5. A brief summary of overall progress and potential

          Do not include Skills Assessment Overview as a title in your response.

          Make your response intuitive and encouraging to the student.
          
          Format the response as HTML with paragraphs (<p>) and potentially lists if needed, but keep it concise, actionable, and encouraging.
          The total response should be around 2-3 paragraphs.
        `;

      // Call Anthropic API
      const response = await client.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      console.log("Anthropic API response:", response);

      // Extract the text from the response
      if (response.content && response.content.length > 0) {
        const contentBlock = response.content[0];
        if (contentBlock.type === "text") {
          setAssessmentOverview(contentBlock.text);
        } else {
          console.error("Unexpected content type:", contentBlock.type);
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
  };

  // Generate the assessment when the component is ready
  useEffect(() => {
    if (!loading && conceptMap && !assessmentOverview) {
      generateSkillsAssessment();
    }
  }, [loading, conceptMap, assessmentOverview]);

  // Log the received data for debugging purposes
  useEffect(() => {
    console.log("Student Task:", studentTask);
    console.log("Code:", code);
    console.log("Conversation History:", conversationHistory);
    console.log("Concept Map:", conceptMap);
  }, [studentTask, code, conversationHistory, conceptMap]);

  if (!isOpen) return null;

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prepare data for the radar charts
  const radarData: RadarDataPoint[] = [];
  const categoryAverages: { subject: string; value: number; fullMark: number }[] = [];

  Object.entries(conceptMap.categories).forEach(([categoryName, subcategories]) => {
    const subcategoryValues = Object.values(subcategories).map(
      (subcat: Subcategory) => subcat.value
    );

    const categoryAvg =
      subcategoryValues.reduce((sum, val) => sum + val, 0) /
      subcategoryValues.length;

    categoryAverages.push({
      subject: categoryName,
      value: Number.parseFloat((categoryAvg * 100).toFixed(1)),
      fullMark: 100,
    });

    Object.entries(subcategories).forEach(([skillKey, subcat]) => {
      console.log(skillKey);
      radarData.push({
        subject: subcat.name,
        value: Number.parseFloat((subcat.value * 100).toFixed(1)),
        category: categoryName,
        fullMark: 100,
        knowledgeState: subcat.knowledgeState,
      });
    });
  });

  const overviewConfig = {
    proficiency: {
      label: "Proficiency",
      color: "hsl(215, 70%, 60%)",
    },
  } as ChartConfig;

  const detailedConfig = {
    proficiency: {
      label: "Skill Proficiency",
      color: "hsl(260, 70%, 60%)",
    },
  } as ChartConfig;

  // Custom tooltip component for charts
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

  // Helper functions to determine skill levels and colors
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

  // Sort skills for identifying development areas
  const sortedSkills = [...radarData].sort((a, b) => b.value - a.value);
  const developmentAreas = [...sortedSkills]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative border border-gray-200 dark:border-gray-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <LoadingScreen />
        ) : (
          <div className="p-6">
            <div className="flex flex-col items-center mb-6 space-y-2">
              <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                Student Knowledge Assessment
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-center">
                A comprehensive analysis of your Python programming skills and
                learning progress
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Overview Chart */}
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
                <CardHeader className="items-center pb-4">
                  <CardTitle className="text-xl text-center">
                    Concept Overview
                  </CardTitle>
                  <CardDescription>
                    Average proficiency level by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <ChartContainer
                    config={overviewConfig}
                    className="mx-auto max-h-[350px]"
                  >
                    <RadarChart data={categoryAverages}>
                      <ChartTooltip
                        cursor={false}
                        content={<CustomTooltip />}
                        trigger="click"
                      />
                      <PolarGrid className="fill-[--color-proficiency] opacity-20" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        tick={{ fill: "currentColor", fontSize: 10 }}
                      />
                      <Radar
                        dataKey="value"
                        name="Proficiency"
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

              {/* Detailed Skills Chart */}
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
                <CardHeader className="items-center pb-4">
                  <CardTitle className="text-xl text-center">
                    Detailed Concept Assessment
                  </CardTitle>
                  <CardDescription>
                    Individual skill proficiency levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <ChartContainer
                    config={detailedConfig}
                    className="mx-auto max-h-[350px]"
                  >
                    <RadarChart data={radarData}>
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
            </div>

            {/* Text Overview Section */}
            <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
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
                        Based on the assessment data, you show particular strength in
                        core programming concepts while there are some areas that could
                        use further attention. Review the detailed breakdown below for
                        specific feedback on each concept.
                      </p>
                      <p className="font-medium">
                        Your progress shows promise, but focusing on the highlighted
                        development areas will help solidify your understanding and boost
                        your overall proficiency.
                      </p>
                    </>
                  )}
                </div>

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
                        <span
                          className={`${getLevelTextColor(
                            skill.value
                          )} font-bold mt-1`}
                        >
                          {skill.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skill Breakdown Table with additional columns for Reasoning, System Confidence and Last Updated */}
            <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
              <CardHeader className="items-center pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  Concept Knowledge Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed view of all assessed skills with reasoning, system confidence, and update timestamps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                          Category
                        </th>
                        <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                          Skill
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
                              {item.knowledgeState?.reasoning || "N/A"}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 p-2">
                              {item.knowledgeState?.lastUpdated || "N/A"}
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
                  <div className="flex items-center p-3 rounded-lg">
                    <div className="w-4 h-4 bg-rose-500 rounded-full mr-2"></div>
                    <span>0-25%: Beginner</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg">
                    <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
                    <span>26-50%: Basic</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    <span>51-75%: Intermediate</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full mr-2"></div>
                    <span>76-100%: Advanced</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeRadarModal;
