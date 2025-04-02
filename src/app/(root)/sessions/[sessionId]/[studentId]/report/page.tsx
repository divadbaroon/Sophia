"use client"

import { useState, useEffect } from "react"
import { TrendingUp, X, Award, BookOpen, Brain, Lightbulb, BarChart3 } from "lucide-react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

// Define types for the concept map structure
interface Concept {
  name: string
  value: number
}

interface CategoryMap {
  [conceptName: string]: Concept
}

interface ConceptMapData {
  categories: {
    [categoryName: string]: CategoryMap
  }
}

// Define types for radar chart data
interface RadarDataPoint {
  subject: string
  value: number
  category?: string
  fullMark: number
}

// Define type for custom tooltip props
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value?: number
    dataKey?: string
  }>
}

// Modal props interface
interface KnowledgeRadarModalProps {
  isOpen: boolean
  onClose: () => void
}

// Button component to open the modal
export const OpenKnowledgeRadarButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button 
        className="mt-24" 
        onClick={() => setIsModalOpen(true)}
      >
        <BarChart3 className="h-5 w-5 mr-2" />
        View Knowledge Assessment
      </Button>
      
      {isModalOpen && (
        <KnowledgeRadarModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  )
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
  )
}

// Main modal component
const KnowledgeRadarModal: React.FC<KnowledgeRadarModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Set a timer to hide the loading screen after 3 seconds
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)
    
    // Clean up the timer if the component unmounts
    return () => clearTimeout(timer)
  }, [])
  
  if (!isOpen) return null

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Process the data for the radar chart
  const conceptMap: ConceptMapData = {
    categories: {
      Functions: {
        "Lambda Functions": {
          name: "Lambda Functions",
          value: 0.2,
        },
      },
      "Python OOP": {
        "Properties and Decorators": {
          name: "Properties and Decorators",
          value: 0.25,
        },
      },
      "List Operations": {
        Indexing: {
          name: "Indexing",
          value: 0.7,
        },
        "List Creation": {
          name: "List Creation",
          value: 0.7,
        },
        "List Modification": {
          name: "List Modification",
          value: 0.2,
        },
      },
      "Basic Programming": {
        Loops: {
          name: "Loops",
          value: 0.7,
        },
        "Conditional Logic": {
          name: "Conditional Logic",
          value: 0.6,
        },
        "Variable Assignment": {
          name: "Variable Assignment",
          value: 0.7,
        },
      },
      "String Manipulation": {
        "String Splitting": {
          name: "String Splitting",
          value: 0.6,
        },
      },
      "Dictionary Operations": {
        "Key-Value Pairs": {
          name: "Key-Value Pairs",
          value: 0.6,
        },
        "Dictionary Lookups": {
          name: "Dictionary Lookups",
          value: 0.7,
        },
        "Dictionary Updates": {
          name: "Dictionary Updates",
          value: 0.7,
        },
        "Dictionary Creation": {
          name: "Dictionary Creation",
          value: 0.7,
        },
      },
    },
  }

  // Prepare data for the radar chart
  const radarData: RadarDataPoint[] = []
  const categoryAverages: RadarDataPoint[] = []

  // Process each category and its subcategories
  Object.entries(conceptMap.categories).forEach(([categoryName, subcategories]) => {
    // Calculate average for the category
    const subcategoryValues = Object.values(subcategories)
    const categoryAvg = subcategoryValues.reduce((sum, subcat) => sum + subcat.value, 0) / subcategoryValues.length

    categoryAverages.push({
      subject: categoryName,
      value: Number.parseFloat((categoryAvg * 100).toFixed(1)),
      fullMark: 100,
    })

    // Add individual subcategories
    Object.values(subcategories).forEach((subcat) => {
      radarData.push({
        subject: subcat.name,
        value: Number.parseFloat((subcat.value * 100).toFixed(1)),
        category: categoryName,
        fullMark: 100,
      })
    })
  })

  // Chart configurations
  const overviewConfig = {
    proficiency: {
      label: "Proficiency",
      color: "hsl(215, 70%, 60%)",
    },
  } satisfies ChartConfig

  const detailedConfig = {
    proficiency: {
      label: "Skill Proficiency",
      color: "hsl(260, 70%, 60%)",
    },
  } satisfies ChartConfig

  // Category-specific chart configs
  const categoryConfigs: Record<string, ChartConfig> = {
    Functions: {
      proficiency: {
        label: "Functions",
        color: "hsl(var(--chart-3))",
      },
    },
    "Python OOP": {
      proficiency: {
        label: "Python OOP",
        color: "hsl(var(--chart-4))",
      },
    },
    "List Operations": {
      proficiency: {
        label: "List Operations",
        color: "hsl(var(--chart-5))",
      },
    },
    "Basic Programming": {
      proficiency: {
        label: "Basic Programming",
        color: "hsl(var(--chart-6))",
      },
    },
    "String Manipulation": {
      proficiency: {
        label: "String Manipulation",
        color: "hsl(var(--chart-7))",
      },
    },
    "Dictionary Operations": {
      proficiency: {
        label: "Dictionary Operations",
        color: "hsl(var(--chart-8))",
      },
    },
  }

  // Custom tooltip component that only shows when directly over a point
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (!active || !payload?.length) return null

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-proficiency)]" />
            <span className="text-sm font-medium">Proficiency</span>
          </div>
          <div className="text-right text-sm font-medium">{`${payload[0]?.value || 0}%`}</div>
        </div>
      </div>
    )
  }

  // Define skill level type and function
  type SkillLevel = "Beginner" | "Basic" | "Intermediate" | "Advanced"

  const getSkillLevel = (value: number): SkillLevel => {
    if (value > 75) return "Advanced"
    if (value > 50) return "Intermediate" 
    if (value > 25) return "Basic"
    return "Beginner"
  }

  const getLevelColor = (value: number): string => {
    if (value > 75) return "bg-emerald-500"
    if (value > 50) return "bg-blue-500" 
    if (value > 25) return "bg-amber-500"
    return "bg-rose-500"
  }

  const getLevelTextColor = (value: number): string => {
    if (value > 75) return "text-emerald-500"
    if (value > 50) return "text-blue-500" 
    if (value > 25) return "text-amber-500"
    return "text-rose-500"
  }

  const getLevelBgColor = (value: number): string => {
    if (value > 75) return "bg-emerald-50 dark:bg-emerald-900/20"
    if (value > 50) return "bg-blue-50 dark:bg-blue-900/20" 
    if (value > 25) return "bg-amber-50 dark:bg-amber-900/20"
    return "bg-rose-50 dark:bg-rose-900/20"
  }

  const getLevelBorderColor = (value: number): string => {
    if (value > 75) return "border-emerald-200 dark:border-emerald-800"
    if (value > 50) return "border-blue-200 dark:border-blue-800" 
    if (value > 25) return "border-amber-200 dark:border-amber-800"
    return "border-rose-200 dark:border-rose-800"
  }

  // Calculate overall proficiency score
  const overallScore = Number.parseFloat(
    (categoryAverages.reduce((sum, cat) => sum + cat.value, 0) / categoryAverages.length).toFixed(1)
  )

  // Get top skills and development areas
  const sortedSkills = [...radarData].sort((a, b) => b.value - a.value)
  const topSkills = sortedSkills.slice(0, 3)
  const developmentAreas = [...sortedSkills].sort((a, b) => a.value - b.value).slice(0, 3)

  // Category icons mapping
  const categoryIcons = {
    "Functions": <BookOpen className="h-5 w-5" />,
    "Python OOP": <Brain className="h-5 w-5" />,
    "List Operations": <BarChart3 className="h-5 w-5" />,
    "Basic Programming": <Lightbulb className="h-5 w-5" />,
    "String Manipulation": <TrendingUp className="h-5 w-5" />,
    "Dictionary Operations": <Award className="h-5 w-5" />
  };

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
                A comprehensive analysis of your Python programming skills and learning progress
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Overview Chart */}
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
                <CardHeader className="items-center pb-4">
                  <CardTitle className="text-xl text-center">Concept Overview</CardTitle>
                  <CardDescription>Average proficiency level by category</CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <ChartContainer config={overviewConfig} className="mx-auto max-h-[350px]">
                    <RadarChart data={categoryAverages}>
                      <ChartTooltip cursor={false} content={<CustomTooltip />} trigger="click" />
                      <PolarGrid className="fill-[--color-proficiency] opacity-20" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 10 }} />
                      <Radar
                        dataKey="value"
                        name="Proficiency"
                        fill="var(--color-proficiency)"
                        fillOpacity={0.6}
                        stroke="var(--color-proficiency)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "var(--color-proficiency)", cursor: "pointer", strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    last updated: 
                  </div>
                </CardFooter>
              </Card>

              {/* Detailed Skills Chart */}
              <Card className="shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
                <CardHeader className="items-center pb-4">
                  <CardTitle className="text-xl text-center">Detailed Concept Assessment</CardTitle>
                  <CardDescription>Individual skill proficiency levels</CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <ChartContainer config={detailedConfig} className="mx-auto max-h-[350px]">
                    <RadarChart data={radarData}>
                      <ChartTooltip cursor={false} content={<CustomTooltip />} trigger="click" />
                      <PolarGrid className="fill-[--color-proficiency] opacity-20" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 10 }} />
                      <Radar
                        dataKey="value"
                        name="Skill Proficiency"
                        fill="var(--color-proficiency)"
                        fillOpacity={0.6}
                        stroke="var(--color-proficiency)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "var(--color-proficiency)", cursor: "pointer", strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 leading-none text-muted-foreground">last updated: </div>
                </CardFooter>
              </Card>
            </div>

            {/* Text Overview Section */}
            <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  Skills Assessment Overview
                </CardTitle>
                <CardDescription>Comprehensive analysis of current proficiency and learning path</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Section */}
                <div className="space-y-3 prose dark:prose-invert max-w-none">
                  <p>
                    Based on the assessment data, you show particular strength in basic programming concepts, list operations, and dictionary operations. These foundational
                    skills provide a solid base for continuing your learning journey.
                  </p>
                  <p className="font-medium">
                    You're making excellent progress! Your strong grasp of core programming concepts shows you have a natural aptitude for logical thinking. With these fundamentals mastered, you're well-positioned to tackle more advanced topics. Keep up the great work - your dedication is clearly paying off!
                  </p>
                </div>

                {/* Development Areas - Full Width */}
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">
                    Areas that need further focus
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {developmentAreas.map((skill, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getLevelBorderColor(skill.value)} ${getLevelBgColor(skill.value)} flex flex-col justify-between h-full`}>
                        <span className="font-medium text-sm">{skill.subject}</span>
                        <span className={`${getLevelTextColor(skill.value)} font-bold mt-1`}>{skill.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skill Breakdown Table */}
            <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800">
              <CardHeader className="items-center pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  Concept Knowledge Breakdown
                </CardTitle>
                <CardDescription>Detailed view of all assessed skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Category</th>
                        <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Skill</th>
                        <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Proficiency</th>
                        <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {radarData.map((item, index) => {
                        const level = getSkillLevel(item.value)
                        const levelColor = getLevelColor(item.value)
                        const textColor = getLevelTextColor(item.value)

                        return (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="border border-gray-200 dark:border-gray-700 p-2">{item.category}</td>
                            <td className="border border-gray-200 dark:border-gray-700 p-2">{item.subject}</td>
                            <td className="border border-gray-200 dark:border-gray-700 p-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${levelColor}`} 
                                  style={{ width: `${item.value}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 p-2">
                              <Badge className={`${textColor.replace('text-', 'bg-').replace('500', '100')} ${textColor}`}>
                                {level}
                              </Badge>
                            </td>
                          </tr>
                        )
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
                    <span className="">0-25%: Beginner</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg">
                    <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
                    <span className="">26-50%: Basic</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    <span className="">51-75%: Intermediate</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="">76-100%: Advanced</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default OpenKnowledgeRadarButton