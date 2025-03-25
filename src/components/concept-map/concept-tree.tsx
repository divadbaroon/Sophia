"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import ProbabilityBar from "./probability-bar"
import TimeProgress from "./time-progress"
import KnowledgeStateTooltip from "./knowledge-state-tooltip"

import { Concept, KnowledgeStatesMap, CustomReasoningMap } from "@/types"

// Generates Sample knowledge states for subconcepts
const generateKnowledgeStates = (timeIndex: number): KnowledgeStatesMap => {
  const baseKnowledgeStates: KnowledgeStatesMap = {
    // Array Manipulation subconcepts
    "Two-pointer Technique": {
      understandingLevel: 0.15,
      confidenceInAssessment: 0.70,
      reasoning: "Student shows very limited understanding of the two-pointer technique. Their solution doesn't utilize this approach at all.",
      lastUpdated: "5 minutes ago",
    },
    "Linear Search": {
      understandingLevel: 0.20,
      confidenceInAssessment: 0.75,
      reasoning: "The student demonstrates basic understanding of linear search but implements it inefficiently within nested loops.",
      lastUpdated: "5 minutes ago",
    },
    "Indexing": {
      understandingLevel: 0.05,
      confidenceInAssessment: 0.65,
      reasoning: "The student's code reveals fundamental misconceptions about zero-based indexing in Python, starting their loop at index 1 instead of 0.",
      lastUpdated: "5 minutes ago",
    },
    "Element Comparison": {
      understandingLevel: 0.25,
      confidenceInAssessment: 0.60,
      reasoning: "The student implements basic element comparison but with inefficient nested loops rather than more optimal approaches.",
      lastUpdated: "5 minutes ago",
    },

    // Data Structures subconcepts
    "Hash Map": {
      understandingLevel: 0.20,
      confidenceInAssessment: 0.60,
      reasoning: "The student doesn't utilize hash maps to optimize lookups, using less efficient lists instead.",
      lastUpdated: "5 minutes ago",
    },
    "Array": {
      understandingLevel: 0.45,
      confidenceInAssessment: 0.70,
      reasoning: "The student shows basic understanding of arrays but has fundamental misconceptions about zero-based indexing.",
      lastUpdated: "5 minutes ago",
    },
    "Key-Value Pair": {
      understandingLevel: 0.20,
      confidenceInAssessment: 0.55,
      reasoning: "The student's solution doesn't demonstrate any usage of key-value associations, using parallel lists instead of a more appropriate hash map.",
      lastUpdated: "5 minutes ago",
    },
    "Lookup Table": {
      understandingLevel: 0.20,
      confidenceInAssessment: 0.50,
      reasoning: "The student's code doesn't implement lookup tables to optimize repeated operations, showing limited understanding of this optimization technique.",
      lastUpdated: "5 minutes ago",
    },

    // Algorithm Design subconcepts
    "Time Complexity": {
      understandingLevel: 0.15,
      confidenceInAssessment: 0.65,
      reasoning: "The student implements a solution with O(n²) time complexity and doesn't recognize this inefficiency, suggesting limited awareness of algorithmic efficiency.",
      lastUpdated: "5 minutes ago",
    },
    "Space Complexity": {
      understandingLevel: 0.20,
      confidenceInAssessment: 0.60,
      reasoning: "The student's solution uses more memory than necessary, maintaining separate lists instead of a more efficient data structure.",
      lastUpdated: "5 minutes ago",
    },
    "Edge Cases": {
      understandingLevel: 0.15,
      confidenceInAssessment: 0.55,
      reasoning: "The student's code doesn't account for important edge cases such as the first element of the array, showing significant gaps in their problem-solving approach.",
      lastUpdated: "5 minutes ago",
    },
    "Brute Force vs Optimal": {
      understandingLevel: 0.25,
      confidenceInAssessment: 0.60,
      reasoning: "The student resorts to a brute force approach without considering more efficient alternatives, suggesting they struggle to identify when and how to optimize their solutions.",
      lastUpdated: "5 minutes ago",
    }
  }

  // Define understanding level changes
  const dramaticChanges: {[key: string]: number[]} = {
    "Two-pointer Technique": [0.15, 0.15, 0.15, 0.20, 0.25],
    "Linear Search": [0.20, 0.20, 0.20, 0.30, 0.40],
    "Indexing": [0.60, 0.05, 0.05, 0.10, 0.20],
    "Element Comparison": [0.25, 0.25, 0.25, 0.30, 0.40],
    "Hash Map": [0.20, 0.20, 0.70, 0.75, 0.80],
    "Array": [0.45, 0.50, 0.50, 0.55, 0.60],
    "Key-Value Pair": [0.20, 0.20, 0.65, 0.70, 0.75],
    "Lookup Table": [0.20, 0.20, 0.20, 0.25, 0.30],
    "Time Complexity": [0.55, 0.55, 0.10, 0.60, 0.70],
    "Space Complexity": [0.20, 0.20, 0.25, 0.35, 0.40],
    "Edge Cases": [0.15, 0.15, 0.15, 0.40, 0.50],
    "Brute Force vs Optimal": [0.35, 0.35, 0.20, 0.65, 0.70]
  }

  // Custom reasoning based on student's code and responses to questions
  const customReasoning: CustomReasoningMap = {
    0: {}, // Initial state - no changes
    1: { // After Question 1 - Indexing
      "Indexing": "Student exhibits a fundamental misconception about array indexing, explicitly stating: 'I started my loop at index 1 because that's where arrays begin in Python.' This confirms complete misunderstanding of zero-based indexing in Python.",
      "Array": "Student shows increased misconception about array structure, believing 'Index 1 is the first element' and that starting at 0 would access 'an element that doesn't exist.' This reveals serious gaps in array fundamentals.",
      "Edge Cases": "Student's code skips the first element of the array (at index 0), which explains why test cases are failing. They don't recognize this is an important edge case."
    },
    2: { // After Question 2 - Time Complexity
      "Time Complexity": "Student demonstrates severe misconception about nested loop time complexity, stating nested loops are 'probably O(n) time complexity' and believing they're 'independent.' This shows fundamental misunderstanding of algorithmic analysis.",
      "Brute Force vs Optimal": "Student incorrectly believes their inefficient approach is optimal, stating 'I know we can't really make it faster than that,' showing lack of awareness of more efficient solutions.",
      "Linear Search": "Student doesn't recognize that their nested linear search approach is inefficient, claiming 'the solution looks through each element once' when it actually performs many redundant checks."
    },
    3: { // After Question 3 - Hash Maps
      "Hash Map": "Student shows significant improvement in understanding hash maps, correctly explaining: 'I could use a dictionary to store each number as a key and its index as a value' and recognizing 'it's an O(1) lookup instead of the O(n) search.'",
      "Key-Value Pair": "Student demonstrates improved grasp of key-value pairs, articulating the correct mapping between numbers and indices for the Two Sum problem.",
      "Time Complexity": "Student now correctly identifies their original solution as O(n²) and recognizes a hash map approach would be O(n), showing marked improvement in algorithmic analysis.",
      "Brute Force vs Optimal": "Student now understands that their initial approach was suboptimal, recognizing that a dictionary-based solution 'makes perfect sense for this problem.'"
    },
    4: { // After Question 4 - Complete Understanding
      "Time Complexity": "Student now demonstrates strong understanding of time complexity, correctly explaining why hash maps provide O(n) complexity versus O(n²) with 'each lookup is O(1) instead of O(n).'",
      "Edge Cases": "Student shows improved awareness of edge cases, mentioning the need to 'ensure we don't use the same element twice, handle empty arrays, and consider what happens if there's no solution.'",
      "Brute Force vs Optimal": "Student now fully grasps the difference between brute force and optimal approaches, clearly articulating why the hash map solution is superior.",
      "Hash Map": "Student demonstrates strong understanding of hash map usage for this problem, correctly explaining its benefits for efficient lookups."
    }
  };

  // Apply the dramatic changes for this time index
  const knowledgeStates: KnowledgeStatesMap = { ...baseKnowledgeStates }
  Object.keys(knowledgeStates).forEach((key) => {
    const state = knowledgeStates[key]
    
    // Apply dramatic changes if defined
    if (dramaticChanges[key] && dramaticChanges[key][timeIndex] !== undefined) {
      state.understandingLevel = dramaticChanges[key][timeIndex]
    }
    
    // Update last updated time
    state.lastUpdated = `${4 - timeIndex} minutes ago`

    // Apply custom reasoning based on the responses to questions
    if (timeIndex > 0 && customReasoning[timeIndex] && customReasoning[timeIndex][key]) {
      state.reasoning = customReasoning[timeIndex][key];
    } else if (timeIndex === 0) {
      // Keep initial state reasoning
    } else {
      // Default reasoning based on understanding level
      if (state.understandingLevel > 0.9) {
        state.reasoning = `Student demonstrates exceptional mastery of ${key}, as evidenced by their code implementation and explicit explanation.`
      } else if (state.understandingLevel > 0.7) {
        state.reasoning = `Student shows strong proficiency with ${key}, though there may still be minor areas for improvement.`
      } else if (state.understandingLevel > 0.5) {
        state.reasoning = `Student shows reasonable understanding of ${key} but still has some gaps in advanced applications.`
      } else if (state.understandingLevel > 0.3) {
        state.reasoning = `Student grasps basic ${key} concepts but struggles with more complex scenarios.`
      } else if (state.understandingLevel > 0.1) {
        state.reasoning = `Student has limited understanding of ${key} and needs significant help, as shown by the fundamental errors in their approach.`
      } else {
        state.reasoning = `Student shows fundamental confusion about ${key} and requires immediate intervention, as evidenced by their incorrect implementation and reasoning.`
      }
    }
    
    // Update confidence based on understanding level and conversation progress
    state.confidenceInAssessment = Math.min(0.95, 0.60 + timeIndex * 0.08);
  })

  return knowledgeStates
}

// Sample data for programming concepts over time periods with dramatic changes
const generateTimeSeriesData = () => {
  // Define probability changes over time
  const probabilityChanges = {
    // Concept-level changes
    "Array Manipulation": [0.35, 0.45, 0.45, 0.30, 0.25],
    "Data Structures": [0.30, 0.30, 0.55, 0.25, 0.20],
    "Algorithm Design": [0.45, 0.45, 0.65, 0.35, 0.30],
    
    // Array Manipulation subconcepts
    "Two-pointer Technique": [0.15, 0.15, 0.15, 0.15, 0.15],
    "Linear Search": [0.20, 0.20, 0.20, 0.20, 0.20],
    "Indexing": [0.60, 0.95, 0.95, 0.95, 0.95],
    "Element Comparison": [0.25, 0.25, 0.25, 0.25, 0.25],
    
    // Data Structures subconcepts
    "Hash Map": [0.25, 0.25, 0.70, 0.20, 0.20],
    "Array": [0.45, 0.50, 0.50, 0.45, 0.45],
    "Key-Value Pair": [0.25, 0.25, 0.30, 0.20, 0.20],
    "Lookup Table": [0.20, 0.20, 0.20, 0.20, 0.20],
    
    // Algorithm Design subconcepts
    "Time Complexity": [0.55, 0.55, 0.90, 0.40, 0.40],
    "Space Complexity": [0.25, 0.25, 0.30, 0.25, 0.25],
    "Edge Cases": [0.40, 0.40, 0.40, 0.40, 0.40],
    "Brute Force vs Optimal": [0.45, 0.45, 0.80, 0.30, 0.30]
  }

  // Base data structure for each time period
  const createTimePeriodData = (timeIndex: number) => {
    return [
      {
        name: "Array Manipulation",
        probability: probabilityChanges["Array Manipulation"][timeIndex],
        colorIndex: 0,
        subconcepts: [
          { name: "Two-pointer Technique", probability: probabilityChanges["Two-pointer Technique"][timeIndex], colorIndex: 0 },
          { name: "Linear Search", probability: probabilityChanges["Linear Search"][timeIndex], colorIndex: 0 },
          { name: "Indexing", probability: probabilityChanges["Indexing"][timeIndex], colorIndex: 0 },
          { name: "Element Comparison", probability: probabilityChanges["Element Comparison"][timeIndex], colorIndex: 0 },
        ],
      },
      {
        name: "Data Structures",
        probability: probabilityChanges["Data Structures"][timeIndex],
        colorIndex: 1,
        subconcepts: [
          { name: "Hash Map", probability: probabilityChanges["Hash Map"][timeIndex], colorIndex: 1 },
          { name: "Array", probability: probabilityChanges["Array"][timeIndex], colorIndex: 1 },
          { name: "Key-Value Pair", probability: probabilityChanges["Key-Value Pair"][timeIndex], colorIndex: 1 },
          { name: "Lookup Table", probability: probabilityChanges["Lookup Table"][timeIndex], colorIndex: 1 },
        ],
      },
      {
        name: "Algorithm Design",
        probability: probabilityChanges["Algorithm Design"][timeIndex],
        colorIndex: 2,
        subconcepts: [
          { name: "Time Complexity", probability: probabilityChanges["Time Complexity"][timeIndex], colorIndex: 2 },
          { name: "Space Complexity", probability: probabilityChanges["Space Complexity"][timeIndex], colorIndex: 2 },
          { name: "Edge Cases", probability: probabilityChanges["Edge Cases"][timeIndex], colorIndex: 2 },
          { name: "Brute Force vs Optimal", probability: probabilityChanges["Brute Force vs Optimal"][timeIndex], colorIndex: 2 },
        ],
      }
    ]
  }

  // Generate data for 5 time periods (initial + 4 questions)
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
              lastUpdated: `${4 - timeIndex} minutes ago`,
            },
          }
        }),
      }
    })
  })
}

// Generate time series data with knowledge states
const timeSeriesData = generateTimeSeriesData()

// Define conversation pivot guidance for each time period
const conversationPivotGuidance = [
  "The student shows a significant misconception in array indexing (0.60) by starting their loop at index 1. Focus your first question on this specific issue - ask them why they chose to start at index 1 rather than index 0, and whether they've considered how this might affect their solution's correctness. This will help determine if they fundamentally misunderstand zero-based indexing in Python or if there's another reason for this choice.",
  "The student has confirmed a fundamental misconception about array indexing (0.95), believing arrays start at index 1 in Python. Now, focus on examining their understanding of time complexity (0.55). Ask them to explain the efficiency of their solution in terms of how many operations it performs for an array of length n. Probe whether they can identify which parts of their algorithm contribute most to its overall running time and if they considered alternative approaches with different time complexities.",
  "The student has confirmed significant misconceptions in both array indexing (0.95) and time complexity analysis (0.90). They believe arrays start at index 1 in Python and incorrectly assess nested loops as O(n) rather than O(n²). For your next question, ask them whether they think a hash map (dictionary in Python) would be more efficient for solving the Two Sum problem and why. This will help assess their understanding of hash maps (0.70) and key-value pairs (0.30), while also revealing whether they can connect appropriate data structures to algorithmic efficiency improvements.",
  "The student shows significantly improved understanding of hash maps (0.20) and appropriate data structures for the Two Sum problem. Their response indicates they now understand that a dictionary provides O(1) lookups and can correctly identify how to implement the solution. Ask them to further elaborate on why this approach improves the time complexity and what edge cases they should consider in their implementation.",
  "The student has demonstrated good progress in most concepts, particularly in understanding hash maps, key-value pairs, and time complexity analysis. To reinforce this learning, have them implement the dictionary-based solution from scratch and walk through a test case to verify their understanding. Encourage them to add appropriate comments that explain the time complexity and any edge case handling in their code."
];

export default function ConceptTree() {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)
  const [concepts, setConcepts] = useState<Concept[]>(
    timeSeriesData[currentTimeIndex].map((concept) => ({ ...concept, expanded: true })),
  )
  const [autoAdvanceActive, setAutoAdvanceActive] = useState(true) // Add state for tracking auto-advance

  // Add auto-advance functionality
  useEffect(() => {
    // Set up a timer to advance to the next time index every 33 seconds
    let timer: NodeJS.Timeout
    
    if (autoAdvanceActive) {
      timer = setTimeout(() => {
        // Advance to the next time index or wrap around to the beginning
        setCurrentTimeIndex((prevIndex) => 
          prevIndex < timeSeriesData.length - 1 ? prevIndex + 1 : 0
        );
      }, 33000); // 33 seconds
    }

    // Clear the timer when component unmounts or when timeIndex changes
    return () => {
      if (timer) clearTimeout(timer);
    }
  }, [currentTimeIndex, timeSeriesData.length, autoAdvanceActive]);

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
    // Optionally pause auto-advance when the user manually changes the time
    // setAutoAdvanceActive(false)
  }

  return (
    <div className="font-mono text-sm pb-24">
      {/* Centered concept map container */}
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-4xl">
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
        </div>
      </div>

      <div className="flex justify-center mb-2">
        <div className="w-full max-w-4xl">
          <p className="text-sm text-gray-600 text-center">
            Visualization displays probability estimates of student misconceptions across related programming concepts.
          </p>
        </div>
      </div>

      {/* Time progress with auto-advance indication */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-4xl">
          <TimeProgress 
            timePoints={timeSeriesData.length} 
            currentTime={currentTimeIndex} 
            onTimeChange={handleTimeChange}
          />
        </div>
      </div>

      {/* Conversation Pivot Guidance - with adjusted spacing */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl p-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
          <h3 className="font-bold mb-1">Conversation Pivot Guidance</h3>
          <p>{conversationPivotGuidance[currentTimeIndex]}</p>
        </div>
      </div>
    </div>
  )
}