'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VisualizationInteractionData } from '@/lib/context/types';
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider';

import { saveVisualizationStrokeData } from '@/lib/actions/visualization-stroke-data-actions'

interface BinaryTreeVisualizationOverlayProps {
  onInteraction: (data: VisualizationInteractionData) => void;
  terminalHeight?: number;
  sessionId: string | null;    
  lessonId: string | null; 
}

const BinaryTreeVisualizationOverlay: React.FC<BinaryTreeVisualizationOverlayProps> = ({ 
  onInteraction, 
  terminalHeight = 50,
  sessionId,     
  lessonId    
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [userDrawings, setUserDrawings] = useState<Array<Array<{x: number, y: number, timestamp: number}>>>([]);

  // Get global drawing state
  const { isDrawingMode, visualizationInteractions } = useCodeEditor();

  useEffect(() => {
      if (userDrawings.length > 0) {
        const latestStroke = userDrawings[userDrawings.length - 1];
        console.log('🎨 Complete stroke data:', {
          strokeNumber: userDrawings.length,
          pointCount: latestStroke.length,
          completePoints: latestStroke,
          startPoint: latestStroke[0],
          endPoint: latestStroke[latestStroke.length - 1]
        });
      }
    }, [userDrawings]);

  // Binary tree zones - each node can be numbered 1-6 in postorder
  const treeZones = {
    nodeD: { x1: 100, y1: 250, x2: 150, y2: 300, correct: 1 }, // First: leftmost leaf
    nodeE: { x1: 200, y1: 250, x2: 250, y2: 300, correct: 2 }, // Second: right leaf of B
    nodeB: { x1: 150, y1: 150, x2: 200, y2: 200, correct: 3 }, // Third: left subtree root
    nodeF: { x1: 500, y1: 250, x2: 550, y2: 300, correct: 4 }, // Fourth: right subtree leaf
    nodeC: { x1: 450, y1: 150, x2: 500, y2: 200, correct: 5 }, // Fifth: right subtree root
    nodeA: { x1: 350, y1: 50, x2: 400, y2: 100, correct: 6 }   // Sixth: tree root
  };

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw binary tree
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.font = '18px Arial';
    ctx.lineWidth = 2;

    // Draw edges
    ctx.beginPath();
    ctx.moveTo(375, 75); ctx.lineTo(175, 175); // A-B
    ctx.moveTo(375, 75); ctx.lineTo(475, 175); // A-C
    ctx.moveTo(175, 175); ctx.lineTo(125, 275); // B-D
    ctx.moveTo(175, 175); ctx.lineTo(225, 275); // B-E
    ctx.moveTo(475, 175); ctx.lineTo(525, 275); // C-F
    ctx.stroke();

    // Draw nodes
    const nodes = [
      { label: 'A', x: 375, y: 75 },
      { label: 'B', x: 175, y: 175 },
      { label: 'C', x: 475, y: 175 },
      { label: 'D', x: 125, y: 275 },
      { label: 'E', x: 225, y: 275 },
      { label: 'F', x: 525, y: 275 }
    ];

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#f8f9fa';
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillText(node.label, node.x - 8, node.y + 6);
    });

    // Redraw user drawings
    redrawUserDrawings(ctx);
  }, []);

  // Listen for clear actions and clear the canvas
  useEffect(() => {
    const lastInteraction = visualizationInteractions[visualizationInteractions.length - 1];
    if (lastInteraction && 
        lastInteraction.action === 'clear' && 
        (lastInteraction.task === 'tree' || lastInteraction.zone === 'global_clear')) {
      setUserDrawings([]);
      drawVisualization();
    }
  }, [visualizationInteractions, drawVisualization]);

  const redrawUserDrawings = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    userDrawings.forEach(stroke => {
      if (stroke.length > 1) {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    });
  }, [userDrawings]);

  const detectZone = useCallback((x: number, y: number) => {
    for (const [zoneName, zone] of Object.entries(treeZones)) {
      if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
        return { name: zoneName, zone: zone };
      }
    }
    return { name: 'elsewhere', zone: { correct: false } };
  }, []);

  const analyzeDrawing = useCallback((stroke: Array<{x: number, y: number}>): { name: string } => {
    if (stroke.length === 0) return { name: 'empty' };
    
    // Use the starting point of the drawing
    const startX = stroke[0].x;
    const startY = stroke[0].y;
    
    // Also check if any significant portion of the stroke is in a zone
    const zoneHits: Record<string, number> = {};
    let sampledPoints = 0;
    
    // Sample every 3rd point to avoid over-sampling
    for (let i = 0; i < stroke.length; i += 3) {
      const detection = detectZone(stroke[i].x, stroke[i].y);
      zoneHits[detection.name] = (zoneHits[detection.name] || 0) + 1;
      sampledPoints++;
    }
    
    // Find the zone with the most hits
    let bestZone = 'elsewhere';
    let maxHits = 0;
    for (const [zoneName, hits] of Object.entries(zoneHits)) {
      if (hits > maxHits) {
        maxHits = hits;
        bestZone = zoneName;
      }
    }
    
    // If most of the drawing is in a valid zone, use that
    if (maxHits > sampledPoints * 0.3) { // 30% threshold
      return { name: bestZone };
    }
    
    // Otherwise, use the starting point
    const startDetection = detectZone(startX, startY);
    return { name: startDetection.name };
  }, [detectZone]);

  // Canvas event handlers - only drawing mode
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return; // Only draw when drawing mode is enabled
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const timestamp = Date.now();
    
    setIsDrawing(true);
    setLastX(x);
    setLastY(y);
    setUserDrawings(prev => [...prev, [{x, y, timestamp}]]);
  }, [isDrawingMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const timestamp = Date.now();
    
    // Add point to current stroke
    setUserDrawings(prev => {
      const newDrawings = [...prev];
      const currentStroke = newDrawings[newDrawings.length - 1];
      currentStroke.push({x, y, timestamp});
      return newDrawings;
    });
    
    // Draw line segment
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastX(x);
    setLastY(y);
  }, [isDrawing, isDrawingMode, lastX, lastY]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode) return;
    
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Analyze what they drew
    const currentStroke = userDrawings[userDrawings.length - 1];
    if (currentStroke) {
      const zone = analyzeDrawing(currentStroke);

      if (currentStroke.length > 1 && sessionId && lessonId) {
        saveVisualizationStrokeData({
          sessionId: sessionId,
          lessonId: lessonId,
          task: 'tree',           
          zone: zone.name,
          strokeNumber: userDrawings.length,
          pointCount: currentStroke.length,
          completePoints: currentStroke,
          startPoint: currentStroke[0],
          endPoint: currentStroke[currentStroke.length - 1]
        }).catch(error => {
          console.error('❌ Error saving stroke:', error);
        });
      }
      
      onInteraction({
        task: 'tree',
        action: 'draw',
        x: Math.round(x),
        y: Math.round(y),
        zone: zone.name
      });
    }
  }, [isDrawing, isDrawingMode, userDrawings, analyzeDrawing, onInteraction]);

  // Initialize canvas
  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]);

  return (
    <div className="h-full flex items-center justify-center bg-white" style={{ paddingBottom: `${terminalHeight}vh` }}>
      <div className="text-center max-w-4xl mx-auto p-6">
        <p className="text-gray-600 mb-6">
          Number the nodes in postorder traversal order using the draw tool above.
          <br />
        </p>
        
        <canvas 
          ref={canvasRef}
          width={800} 
          height={400}
          className={`border-2 border-gray-300 rounded-lg shadow-sm mx-auto ${
            isDrawingMode ? 'cursor-crosshair' : 'cursor-not-allowed'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ maxWidth: '100%' }}
        />
      </div>
    </div>
  );
};

export default BinaryTreeVisualizationOverlay;