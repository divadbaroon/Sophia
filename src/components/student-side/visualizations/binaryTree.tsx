import React, { useState, useEffect } from 'react';

export interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface TreeVisualizationProps {
  treeRoot: TreeNode | null;
}

export const TreeVisualization: React.FC<TreeVisualizationProps> = ({ treeRoot }) => {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  // Log when selected node changes
  useEffect(() => {
    if (selectedNode !== null) {
      console.log('🌳 Tree Node Selected:', selectedNode);
    } else {
      console.log('🌳 Tree Node Deselected');
    }
  }, [selectedNode]);

  const handleNodeClick = (nodeValue: number) => {
    const newSelection = nodeValue === selectedNode ? null : nodeValue;
    setSelectedNode(newSelection);
  };

  if (!treeRoot) {
    return (
      <div className="absolute top-24 left-1/3 transform -translate-x-1/2 mt-12 z-20 border border-gray-300 rounded-lg shadow-lg p-4 bg-gray-50/95">
        <div className="text-xs font-semibold text-gray-700 mb-3 text-center">Binary Search Tree</div>
        <div className="text-gray-600 text-sm font-medium text-center py-4">
          Tree is empty
        </div>
      </div>
    );
  }

  const renderTree = (node: TreeNode, x: number, y: number, level: number) => {
    const nodeSize = 40;
    const levelGap = 55;
    const horizontalSpacing = level === 0 ? 75 : Math.max(30, 60 / (level + 1));
    const isSelected = selectedNode === node.value;

    return (
      <g key={`${node.value}-${x}-${y}`}>
        {/* Render left child and edge */}
        {node.left && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x - horizontalSpacing}
              y2={y + levelGap}
              stroke="#666"
              strokeWidth="2"
              opacity="0.7"
            />
            {renderTree(node.left, x - horizontalSpacing, y + levelGap, level + 1)}
          </>
        )}
        
        {/* Render right child and edge */}
        {node.right && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x + horizontalSpacing}
              y2={y + levelGap}
              stroke="#666"
              strokeWidth="2"
              opacity="0.7"
            />
            {renderTree(node.right, x + horizontalSpacing, y + levelGap, level + 1)}
          </>
        )}
        
        {/* Render current node */}
        <g>
          <defs>
            <linearGradient id={`nodeGradient-${node.value}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isSelected ? "#fbbf24" : "#84fab0"} />
              <stop offset="100%" stopColor={isSelected ? "#f59e0b" : "#8fd3f4"} />
            </linearGradient>
          </defs>
          <circle
            cx={x}
            cy={y}
            r={nodeSize / 2}
            fill={`url(#nodeGradient-${node.value})`}
            stroke={isSelected ? "#f59e0b" : "#fff"}
            strokeWidth={isSelected ? "3" : "2"}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleNodeClick(node.value)}
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="16"
            fontWeight="bold"
            fill="#333"
            style={{ pointerEvents: 'none' }}
          >
            {node.value}
          </text>
        </g>
      </g>
    );
  };

  // Calculate tree dimensions
  const getTreeDepth = (node: TreeNode | null): number => {
    if (!node) return 0;
    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
  };

  const depth = getTreeDepth(treeRoot);
  const width = Math.max(280, depth * 80);
  const height = Math.max(200, depth * 60);

  return (
    <div className="absolute top-24 left-1/3 transform -translate-x-1/2 mt-12 z-20 border border-gray-300 rounded-lg shadow-lg p-4 bg-gray-50/95">
      <div className="text-xs font-semibold text-gray-700 mb-3 text-center">Binary Search Tree</div>
      
      <div className="overflow-auto max-w-lg max-h-96">
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
        >
          {renderTree(treeRoot, width / 2, 30, 0)}
        </svg>
      </div>
    </div>
  );
};

export default TreeVisualization;