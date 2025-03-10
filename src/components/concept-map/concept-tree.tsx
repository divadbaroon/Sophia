"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import ProbabilityBar from "./probability-bar"
import TimeProgress from "./time-progress"
import KnowledgeStateTooltip from "./knowledge-state-tooltip"

// Define the data structure for knowledge state
interface KnowledgeState {
  understandingLevel: number
  confidenceInAssessment: number
  reasoning: string
  lastUpdated: string
}

// Define the data structure for concepts
interface Subconcept {
  name: string
  probability: number
  colorIndex: number
  knowledgeState?: KnowledgeState
}

interface Concept {
  name: string
  probability: number
  colorIndex: number
  subconcepts: Subconcept[]
  expanded?: boolean
}

// Define a type for the knowledge states mapping
interface KnowledgeStatesMap {
  [key: string]: KnowledgeState;
}

// Sample knowledge states for subconcepts
const generateKnowledgeStates = (timeIndex: number): KnowledgeStatesMap => {
  // Base knowledge states that will be modified based on time
  const baseKnowledgeStates: KnowledgeStatesMap = {
    // OOP subconcepts
    "Class Design & Implementation": {
      understandingLevel: 0.35,
      confidenceInAssessment: 0.85,
      reasoning: "Student struggles with proper class design principles and inheritance hierarchies.",
      lastUpdated: "10 minutes ago",
    },
    "Encapsulation & Access Control": {
      understandingLevel: 0.65,
      confidenceInAssessment: 0.9,
      reasoning: "Student understands basic private/public access but misapplies in complex scenarios.",
      lastUpdated: "15 minutes ago",
    },
    "Method Overloading & Overriding": {
      understandingLevel: 0.4,
      confidenceInAssessment: 0.75,
      reasoning: "Student confuses method overloading with overriding. Struggles with dynamic dispatch.",
      lastUpdated: "12 minutes ago",
    },
    "Interface Implementation": {
      understandingLevel: 0.45,
      confidenceInAssessment: 0.7,
      reasoning: "Student understands interface syntax but struggles with implementing multiple interfaces.",
      lastUpdated: "25 minutes ago",
    },

    // Data Structures subconcepts
    "Array Operations & Manipulation": {
      understandingLevel: 0.7,
      confidenceInAssessment: 0.9,
      reasoning: "Student is comfortable with basic array operations but struggles with more complex manipulations.",
      lastUpdated: "18 minutes ago",
    },
    "Hash Table Implementation": {
      understandingLevel: 0.3,
      confidenceInAssessment: 0.8,
      reasoning: "Student understands basic hash function concepts but struggles with collision resolution.",
      lastUpdated: "35 minutes ago",
    },
    "Set & Map Usage": {
      understandingLevel: 0.55,
      confidenceInAssessment: 0.85,
      reasoning: "Student can use basic set operations but has difficulty with more advanced map operations.",
      lastUpdated: "22 minutes ago",
    },
    "Iterating Over Collections": {
      understandingLevel: 0.65,
      confidenceInAssessment: 0.9,
      reasoning: "Student is comfortable with basic iteration patterns but struggles with nested iterations.",
      lastUpdated: "20 minutes ago",
    },
    "Dictionary/Map Traversal": {
      understandingLevel: 0.45,
      confidenceInAssessment: 0.8,
      reasoning: "Student can traverse maps but has difficulty with efficient key-based lookups.",
      lastUpdated: "28 minutes ago",
    },
    "Key-Value Pair Management": {
      understandingLevel: 0.5,
      confidenceInAssessment: 0.85,
      reasoning: "Student understands basic key-value operations but struggles with complex transformations.",
      lastUpdated: "30 minutes ago",
    },
    "Value Existence Checking": {
      understandingLevel: 0.6,
      confidenceInAssessment: 0.9,
      reasoning: "Student can check for existence but sometimes uses inefficient methods.",
      lastUpdated: "25 minutes ago",
    },
    "Memory Access Patterns": {
      understandingLevel: 0.25,
      confidenceInAssessment: 0.7,
      reasoning: "Student has limited understanding of memory locality and cache efficiency.",
      lastUpdated: "40 minutes ago",
    },

    // Algorithms subconcepts
    "Search Algorithms": {
      understandingLevel: 0.6,
      confidenceInAssessment: 0.8,
      reasoning: "Student understands linear and binary search but struggles with more complex search algorithms.",
      lastUpdated: "28 minutes ago",
    },
    "Time & Space Complexity Analysis": {
      understandingLevel: 0.4,
      confidenceInAssessment: 0.75,
      reasoning: "Student can analyze simple algorithms but struggles with more complex time/space tradeoffs.",
      lastUpdated: "32 minutes ago",
    },
    "Algorithm Optimization": {
      understandingLevel: 0.3,
      confidenceInAssessment: 0.7,
      reasoning: "Student recognizes inefficient code but has difficulty implementing optimizations.",
      lastUpdated: "35 minutes ago",
    },
    "Single-Pass Algorithm Design": {
      understandingLevel: 0.25,
      confidenceInAssessment: 0.65,
      reasoning: "Student often defaults to multi-pass solutions when single-pass would be more efficient.",
      lastUpdated: "38 minutes ago",
    },
    "Early Termination Strategy": {
      understandingLevel: 0.45,
      confidenceInAssessment: 0.8,
      reasoning: "Student sometimes implements early termination but misses opportunities in complex algorithms.",
      lastUpdated: "30 minutes ago",
    },
    "In-Place vs. Extra Space Solutions": {
      understandingLevel: 0.35,
      confidenceInAssessment: 0.75,
      reasoning: "Student understands the concept but often defaults to extra space solutions unnecessarily.",
      lastUpdated: "33 minutes ago",
    },
    "Two-Pointer Technique": {
      understandingLevel: 0.4,
      confidenceInAssessment: 0.8,
      reasoning: "Student can implement basic two-pointer approaches but struggles with more complex applications.",
      lastUpdated: "29 minutes ago",
    },

    // Functions subconcepts
    "Parameter Passing Mechanisms": {
      understandingLevel: 0.55,
      confidenceInAssessment: 0.85,
      reasoning: "Student understands basic pass-by-value vs. reference but struggles with complex object passing.",
      lastUpdated: "26 minutes ago",
    },
    "Return Value Handling": {
      understandingLevel: 0.6,
      confidenceInAssessment: 0.9,
      reasoning: "Student handles return values appropriately in most cases but sometimes neglects error cases.",
      lastUpdated: "24 minutes ago",
    },
    "Pure Functions vs. Side Effects": {
      understandingLevel: 0.3,
      confidenceInAssessment: 0.7,
      reasoning: "Student struggles with identifying and avoiding side effects in functions.",
      lastUpdated: "35 minutes ago",
    },
    "Function Composition": {
      understandingLevel: 0.25,
      confidenceInAssessment: 0.65,
      reasoning: "Student has difficulty composing functions effectively for complex operations.",
      lastUpdated: "40 minutes ago",
    },
    "Default Return Handling": {
      understandingLevel: 0.5,
      confidenceInAssessment: 0.8,
      reasoning: "Student sometimes forgets to handle default return cases in complex functions.",
      lastUpdated: "27 minutes ago",
    },
    "Edge Case Management": {
      understandingLevel: 0.4,
      confidenceInAssessment: 0.75,
      reasoning: "Student identifies common edge cases but misses more subtle ones.",
      lastUpdated: "31 minutes ago",
    },
    "Input Validation": {
      understandingLevel: 0.45,
      confidenceInAssessment: 0.8,
      reasoning: "Student performs basic validation but sometimes misses complex validation requirements.",
      lastUpdated: "29 minutes ago",
    },

    // Mathematical Operations subconcepts
    "Numerical Computation": {
      understandingLevel: 0.5,
      confidenceInAssessment: 0.85,
      reasoning: "Student can perform basic numerical computations but struggles with numerical stability issues.",
      lastUpdated: "27 minutes ago",
    },
    "Combinatorial Calculations": {
      understandingLevel: 0.3,
      confidenceInAssessment: 0.7,
      reasoning: "Student understands basic combinatorics but has difficulty with more complex counting problems.",
      lastUpdated: "36 minutes ago",
    },
    "Mathematical Logic Operations": {
      understandingLevel: 0.55,
      confidenceInAssessment: 0.8,
      reasoning: "Student can apply basic logical operations but struggles with complex boolean expressions.",
      lastUpdated: "25 minutes ago",
    },
    "Complement Calculation": {
      understandingLevel: 0.4,
      confidenceInAssessment: 0.75,
      reasoning: "Student sometimes confuses complement operations in set theory and boolean logic.",
      lastUpdated: "32 minutes ago",
    },
    "Pair Finding Logic": {
      understandingLevel: 0.45,
      confidenceInAssessment: 0.8,
      reasoning: "Student can find pairs in simple cases but struggles with efficient algorithms for large datasets.",
      lastUpdated: "30 minutes ago",
    },
    "Equality Checking": {
      understandingLevel: 0.6,
      confidenceInAssessment: 0.85,
      reasoning: "Student understands basic equality but sometimes confuses reference equality with value equality.",
      lastUpdated: "23 minutes ago",
    },
  }

  // Improve understanding levels based on time index (message number)
  const knowledgeStates: KnowledgeStatesMap = { ...baseKnowledgeStates }

  // For each time period, increase understanding by 0.1 (capped at 0.95)
  Object.keys(knowledgeStates).forEach((key) => {
    const state = knowledgeStates[key]
    // Increase understanding based on time
    state.understandingLevel = Math.min(0.95, state.understandingLevel + timeIndex * 0.1)
    // Update last updated time
    state.lastUpdated = `${5 - timeIndex} minutes ago`

    // Update reasoning based on new understanding level
    if (state.understandingLevel > 0.8) {
      state.reasoning = `Student demonstrates strong mastery of ${key} with only minor misconceptions.`
    } else if (state.understandingLevel > 0.6) {
      state.reasoning = `Student shows good understanding of ${key} but still has some gaps in advanced applications.`
    } else if (state.understandingLevel > 0.4) {
      state.reasoning = `Student grasps basic ${key} concepts but struggles with more complex scenarios.`
    }
  })

  return knowledgeStates
}

// Sample data for programming concepts over time periods (representing student messages)
const generateTimeSeriesData = () => {
  // Base data structure for each time period
  const createTimePeriodData = (timeIndex: number) => {
    // Adjust probabilities based on time index
    const timeMultiplier = 1 - timeIndex * 0.1
    const inverseTimeMultiplier = 0.6 + timeIndex * 0.1

    return [
      {
        name: "Object-Oriented Programming",
        probability: 0.47 * timeMultiplier,
        colorIndex: 0,
        subconcepts: [
          { name: "Class Design & Implementation", probability: 0.15 * timeMultiplier, colorIndex: 0 },
          { name: "Encapsulation & Access Control", probability: 0.12 * timeMultiplier, colorIndex: 0 },
          { name: "Method Overloading & Overriding", probability: 0.12 * timeMultiplier, colorIndex: 0 },
          { name: "Interface Implementation", probability: 0.08 * timeMultiplier, colorIndex: 0 },
        ],
      },
      {
        name: "Data Structures",
        probability: 0.22 * inverseTimeMultiplier,
        colorIndex: 1,
        subconcepts: [
          { name: "Array Operations & Manipulation", probability: 0.05 * inverseTimeMultiplier, colorIndex: 1 },
          { name: "Hash Table Implementation", probability: 0.03 * inverseTimeMultiplier, colorIndex: 1 },
          { name: "Set & Map Usage", probability: 0.03 * inverseTimeMultiplier, colorIndex: 1 },
          { name: "Iterating Over Collections", probability: 0.03 * inverseTimeMultiplier, colorIndex: 1 },
          { name: "Dictionary/Map Traversal", probability: 0.02 * inverseTimeMultiplier, colorIndex: 1 },
          { name: "Key-Value Pair Management", probability: 0.02 * inverseTimeMultiplier, colorIndex: 1 },
          { name: "Value Existence Checking", probability: 0.02 * inverseTimeMultiplier, colorIndex: 1 },
          { name: "Memory Access Patterns", probability: 0.02 * inverseTimeMultiplier, colorIndex: 1 },
        ],
      },
      {
        name: "Algorithms",
        probability: 0.12 * inverseTimeMultiplier,
        colorIndex: 2,
        subconcepts: [
          { name: "Search Algorithms", probability: 0.03 * inverseTimeMultiplier, colorIndex: 2 },
          { name: "Time & Space Complexity Analysis", probability: 0.02 * inverseTimeMultiplier, colorIndex: 2 },
          { name: "Algorithm Optimization", probability: 0.02 * inverseTimeMultiplier, colorIndex: 2 },
          { name: "Single-Pass Algorithm Design", probability: 0.01 * inverseTimeMultiplier, colorIndex: 2 },
          { name: "Early Termination Strategy", probability: 0.01 * inverseTimeMultiplier, colorIndex: 2 },
          { name: "In-Place vs. Extra Space Solutions", probability: 0.01 * inverseTimeMultiplier, colorIndex: 2 },
          { name: "Two-Pointer Technique", probability: 0.02 * inverseTimeMultiplier, colorIndex: 2 },
        ],
      },
      {
        name: "Functions",
        probability: 0.1 * inverseTimeMultiplier,
        colorIndex: 3,
        subconcepts: [
          { name: "Parameter Passing Mechanisms", probability: 0.02 * inverseTimeMultiplier, colorIndex: 3 },
          { name: "Return Value Handling", probability: 0.02 * inverseTimeMultiplier, colorIndex: 3 },
          { name: "Pure Functions vs. Side Effects", probability: 0.01 * inverseTimeMultiplier, colorIndex: 3 },
          { name: "Function Composition", probability: 0.01 * inverseTimeMultiplier, colorIndex: 3 },
          { name: "Default Return Handling", probability: 0.01 * inverseTimeMultiplier, colorIndex: 3 },
          { name: "Edge Case Management", probability: 0.02 * inverseTimeMultiplier, colorIndex: 3 },
          { name: "Input Validation", probability: 0.01 * inverseTimeMultiplier, colorIndex: 3 },
        ],
      },
      {
        name: "Mathematical Operations",
        probability: 0.09 * inverseTimeMultiplier,
        colorIndex: 4,
        subconcepts: [
          { name: "Numerical Computation", probability: 0.02 * inverseTimeMultiplier, colorIndex: 4 },
          { name: "Combinatorial Calculations", probability: 0.01 * inverseTimeMultiplier, colorIndex: 4 },
          { name: "Mathematical Logic Operations", probability: 0.02 * inverseTimeMultiplier, colorIndex: 4 },
          { name: "Complement Calculation", probability: 0.01 * inverseTimeMultiplier, colorIndex: 4 },
          { name: "Pair Finding Logic", probability: 0.02 * inverseTimeMultiplier, colorIndex: 4 },
          { name: "Equality Checking", probability: 0.01 * inverseTimeMultiplier, colorIndex: 4 },
        ],
      },
    ]
  }

  // Generate data for 5 time periods
  const baseData = [
    createTimePeriodData(0),
    createTimePeriodData(1),
    createTimePeriodData(2),
    createTimePeriodData(3),
    createTimePeriodData(4),
  ]

  // Add knowledge states to each subconcept for each time period
  return baseData.map((timePeriod, timeIndex) => {
    const knowledgeStates = generateKnowledgeStates(timeIndex)

    return timePeriod.map((concept) => {
      return {
        ...concept,
        subconcepts: concept.subconcepts.map((subconcept) => {
          return {
            ...subconcept,
            knowledgeState: knowledgeStates[subconcept.name] || {
              understandingLevel: 0.3 + timeIndex * 0.1,
              confidenceInAssessment: 0.7 + timeIndex * 0.05,
              reasoning: `Student has some basic understanding of ${subconcept.name} but needs more practice.`,
              lastUpdated: `${5 - timeIndex} minutes ago`,
            },
          }
        }),
      }
    })
  })
}

// Generate time series data with knowledge states
const timeSeriesData = generateTimeSeriesData()

export default function ConceptTree() {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)
  const [concepts, setConcepts] = useState<Concept[]>(
    timeSeriesData[currentTimeIndex].map((concept) => ({ ...concept, expanded: true })),
  )

  useEffect(() => {
    // Preserve expanded state when time changes
    const expandedState = concepts.map((c) => c.expanded)
    setConcepts(
      timeSeriesData[currentTimeIndex].map((concept, i) => ({
        ...concept,
        expanded: expandedState[i] || false,
      })),
    )
  }, [currentTimeIndex])

  const toggleConcept = (index: number) => {
    setConcepts((prevConcepts) =>
      prevConcepts.map((concept, i) => (i === index ? { ...concept, expanded: !concept.expanded } : concept)),
    )
  }

  const handleTimeChange = (timeIndex: number) => {
    setCurrentTimeIndex(timeIndex)
  }

  return (
    <div className="font-mono text-sm pb-24">
      {/* Concepts directly at the top level, no root node */}
      {concepts.map((concept, index) => (
        <div key={index}>
          {/* Concept row */}
          <div className="flex items-start mb-1">
            <button className="flex items-center focus:outline-none min-w-[300px]" onClick={() => toggleConcept(index)}>
              <ChevronDown
                className={`h-4 w-4 transform ${concept.expanded ? "rotate-0" : "-rotate-90"} transition-transform mr-2`}
              />
              <span className="font-bold">{concept.name}</span>
            </button>
            <div className="w-16 text-right mr-2 font-mono tabular-nums">{concept.probability.toFixed(2)}</div>
            <ProbabilityBar probability={concept.probability} colorIndex={concept.colorIndex} />
          </div>

          {/* Subconcepts */}
          {concept.expanded && (
            <div className="ml-6">
              {concept.subconcepts.map((subconcept, subIndex) => (
                <div key={subIndex} className="flex items-start mb-1">
                  <div className="min-w-[300px] pl-6 flex items-center">
                    {subconcept.name}
                    {subconcept.knowledgeState && <KnowledgeStateTooltip knowledgeState={subconcept.knowledgeState} />}
                  </div>
                  <div className="w-16 text-right mr-2 font-mono tabular-nums">{subconcept.probability.toFixed(2)}</div>
                  <ProbabilityBar probability={subconcept.probability} colorIndex={concept.colorIndex} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Time progress with next message button */}
      <TimeProgress timePoints={timeSeriesData.length} currentTime={currentTimeIndex} onTimeChange={handleTimeChange} />
    </div>
  )
}