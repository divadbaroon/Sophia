"use client"

import React, { useState } from 'react';

import { Branch, MainConcept, Connection, ConceptItem } from "@/types"

const FluidConceptTree: React.FC = () => {
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null);

  const conceptsData: MainConcept[] = [
    {
      id: 'variables',
      name: 'Variables & Data Types',
      x: 80,
      y: 120,
      branches: [
        { id: 'primitives', name: 'Primitive Types', x: 360, y: 60 },
        { id: 'strings', name: 'String Operations', x: 640, y: 20 },
        { id: 'string-methods', name: 'String Methods', x: 920, y: 0 },
        { id: 'string-parsing', name: 'String Parsing', x: 920, y: 60 },
        { id: 'arrays', name: 'Arrays & Lists', x: 360, y: 140 },
        { id: 'array-methods', name: 'Array Methods', x: 640, y: 120 },
        { id: 'iteration', name: 'Array Iteration', x: 920, y: 100 },
        { id: 'objects', name: 'Objects & Maps', x: 360, y: 220 },
        { id: 'object-props', name: 'Object Properties', x: 640, y: 200 },
        { id: 'destructuring', name: 'Destructuring', x: 920, y: 180 }
      ]
    },
    {
      id: 'control-flow',
      name: 'Control Flow',
      x: 80,
      y: 380,
      branches: [
        { id: 'conditionals', name: 'Conditionals', x: 360, y: 320 },
        { id: 'boolean-logic', name: 'Boolean Logic', x: 640, y: 280 },
        { id: 'complex-conditions', name: 'Complex Conditions', x: 920, y: 260 },
        { id: 'loops', name: 'Loops', x: 360, y: 400 },
        { id: 'loop-patterns', name: 'Loop Patterns', x: 640, y: 380 },
        { id: 'loop-control', name: 'Loop Control', x: 920, y: 340 },
        { id: 'error-handling', name: 'Error Handling', x: 360, y: 480 },
        { id: 'exceptions', name: 'Exception Types', x: 640, y: 460 },
        { id: 'debugging', name: 'Debugging', x: 920, y: 440 }
      ]
    },
    {
      id: 'functions',
      name: 'Functions',
      x: 80,
      y: 640,
      branches: [
        { id: 'basic-functions', name: 'Function Basics', x: 360, y: 580 },
        { id: 'parameters', name: 'Parameters', x: 640, y: 540 },
        { id: 'default-params', name: 'Default Parameters', x: 920, y: 520 },
        { id: 'return-values', name: 'Return Values', x: 640, y: 600 },
        { id: 'function-scope', name: 'Function Scope', x: 920, y: 580 },
        { id: 'advanced-functions', name: 'Advanced Functions', x: 360, y: 680 },
        { id: 'closures', name: 'Closures', x: 640, y: 660 },
        { id: 'higher-order', name: 'Higher-Order Functions', x: 920, y: 640 },
        { id: 'recursion', name: 'Recursion', x: 640, y: 720 },
        { id: 'memoization', name: 'Memoization', x: 920, y: 700 }
      ]
    },
    {
      id: 'data-structures',
      name: 'Data Structures & Algorithms',
      x: 80,
      y: 900,
      branches: [
        { id: 'linear-structures', name: 'Linear Structures', x: 360, y: 840 },
        { id: 'stacks-queues', name: 'Stacks & Queues', x: 640, y: 800 },
        { id: 'linked-lists', name: 'Linked Lists', x: 920, y: 780 },
        { id: 'trees', name: 'Tree Structures', x: 360, y: 920 },
        { id: 'binary-trees', name: 'Binary Trees', x: 640, y: 880 },
        { id: 'tree-traversal', name: 'Tree Traversal', x: 920, y: 860 },
        { id: 'graphs', name: 'Graph Structures', x: 360, y: 1000 },
        { id: 'graph-algorithms', name: 'Graph Algorithms', x: 640, y: 960 },
        { id: 'complexity', name: 'Time Complexity', x: 920, y: 940 }
      ]
    }
  ];

  // Create smooth curved path between two points
  const createCurvePath = (x1: number, y1: number, x2: number, y2: number): string => {
    const midX = x1 + (x2 - x1) * 0.6;
    return `M ${x1} ${y1} Q ${midX} ${y1} ${x2} ${y2}`;
  };

  // Find connections between concepts
  const getConnections = (): Connection[] => {
    const connections: Connection[] = [];
    conceptsData.forEach((mainConcept: MainConcept) => {
      mainConcept.branches.forEach((branch: Branch) => {
        connections.push({
          from: mainConcept,
          to: branch,
          id: `${mainConcept.id}-${branch.id}`
        });
      });
    });
    return connections;
  };

  // Type guard to check if a concept is a main concept
  const isMainConcept = (concept: ConceptItem): concept is MainConcept => {
    return 'branches' in concept;
  };

  const allConcepts: ConceptItem[] = [
    ...conceptsData,
    ...conceptsData.flatMap((concept: MainConcept) => concept.branches)
  ];

  const connections: Connection[] = getConnections();

  const handleMouseEnter = (conceptId: string) => {
    setHoveredConcept(conceptId);
  };

  const handleMouseLeave = () => {
    setHoveredConcept(null);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-full mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-3 text-center">
          Programming Concepts Knowledge Tree
        </h1>
        <p className="text-gray-600 mb-8 text-center text-lg">
          A fluid representation of how programming knowledge branches and flows
        </p>
        
        <div className="overflow-x-auto bg-white rounded-2xl shadow-xl p-8">
          <svg 
            width="1400" 
            height="1100" 
            className="min-w-full"
            viewBox="0 0 1400 1100"
          >
            {/* Render all curved connections */}
            {connections.map((connection: Connection) => (
              <path
                key={connection.id}
                d={createCurvePath(
                  connection.from.x + 160,
                  connection.from.y + 25,
                  connection.to.x,
                  connection.to.y + 25
                )}
                stroke="#d1d5db"
                strokeWidth="2"
                fill="none"
                className={`transition-all duration-300 ${
                  hoveredConcept === connection.from.id || hoveredConcept === connection.to.id
                    ? 'stroke-blue-400 stroke-opacity-80'
                    : 'stroke-opacity-40'
                }`}
              />
            ))}

            {/* Render all concepts */}
            {allConcepts.map((concept: ConceptItem) => {
              const isMain = isMainConcept(concept);
              const isHovered = hoveredConcept === concept.id;
              
              return (
                <g key={concept.id}>
                  {/* Concept bubble */}
                  <rect
                    x={concept.x}
                    y={concept.y}
                    width={isMain ? 160 : 140}
                    height="50"
                    rx="25"
                    className={`transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl ${
                      isMain
                        ? isHovered
                          ? 'fill-blue-600'
                          : 'fill-blue-500'
                        : isHovered
                        ? 'fill-gray-300'
                        : 'fill-gray-200'
                    }`}
                    onMouseEnter={() => handleMouseEnter(concept.id)}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  {/* Concept text */}
                  <text
                    x={concept.x + (isMain ? 80 : 70)}
                    y={concept.y + 25}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`pointer-events-none font-medium transition-colors duration-300 ${
                      isMain
                        ? 'fill-white text-sm'
                        : isHovered
                        ? 'fill-gray-800 text-xs'
                        : 'fill-gray-700 text-xs'
                    }`}
                  >
                    {concept.name}
                  </text>

                  {/* Add subtle glow effect for hovered concepts */}
                  {isHovered && (
                    <rect
                      x={concept.x - 2}
                      y={concept.y - 2}
                      width={isMain ? 164 : 144}
                      height="54"
                      rx="27"
                      className="fill-none stroke-blue-400 stroke-2 opacity-50 pointer-events-none"
                    />
                  )}
                </g>
              );
            })}

            {/* Optional: Add some decorative elements */}
            <defs>
              <radialGradient id="backgroundGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f3f4f6" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="#f3f4f6" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="700" cy="550" r="500" fill="url(#backgroundGlow)" className="pointer-events-none"/>
          </svg>
        </div>
        
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span>Core Concepts</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded-full mr-2"></div>
              <span>Related Topics</span>
            </div>
          </div>
          <p className="mt-4 text-gray-500">
            💡 Hover over any concept to see its connections highlighted
          </p>
        </div>
      </div>
    </div>
  );
};

export default FluidConceptTree;