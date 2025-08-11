'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VisualizationInteractionData } from '@/lib/context/types';
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider';

interface DFSVisualizationOverlayProps {
  onInteraction: (data: VisualizationInteractionData) => void;
  terminalHeight?: number;
}

const DFSVisualizationOverlay: React.FC<DFSVisualizationOverlayProps> = ({ 
  onInteraction, 
  terminalHeight = 50 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [userDrawings, setUserDrawings] = useState<Array<Array<{x: number, y: number}>>>([]);
  const [feedback, setFeedback] = useState('Draw on the nodes to number them in DFS visit order (starting from node 1)');
  const [feedbackType, setFeedbackType] = useState<'info' | 'correct' | 'incorrect'>('info');

  // Get global drawing state
  const { isDrawingMode, visualizationInteractions } = useCodeEditor();


  // DFS task zones - each node can be numbered 1-5
  const dfsZones = {
    node1: { x1: 350, y1: 50, x2: 450, y2: 100, correct: 1 },
    node2: { x1: 250, y1: 150, x2: 350, y2: 200, correct: 2 },
    node3: { x1: 450, y1: 150, x2: 550, y2: 200, correct: 5 },
    node5: { x1: 150, y1: 250, x2: 250, y2: 300, correct: 3 },
    node6: { x1: 350, y1: 250, x2: 450, y2: 300, correct: 4 }
  };

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw DFS graph
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.lineWidth = 2;

    // Draw edges
    ctx.beginPath();
    ctx.moveTo(400, 75); ctx.lineTo(300, 175); // 1-2
    ctx.moveTo(400, 75); ctx.lineTo(500, 175); // 1-3
    ctx.moveTo(300, 175); ctx.lineTo(200, 275); // 2-5
    ctx.moveTo(300, 175); ctx.lineTo(400, 275); // 2-6
    ctx.stroke();

    // Draw nodes
    const nodes = [
      { id: '1', x: 400, y: 75 },
      { id: '2', x: 300, y: 175 },
      { id: '3', x: 500, y: 175 },
      { id: '5', x: 200, y: 275 },
      { id: '6', x: 400, y: 275 }
    ];

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#f8f9fa';
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillText(node.id, node.x - 8, node.y + 7);
    });

    // Redraw user drawings
    redrawUserDrawings(ctx);
  }, []);

    // Listen for clear actions and clear the canvas
  useEffect(() => {
    const lastInteraction = visualizationInteractions[visualizationInteractions.length - 1];
    if (lastInteraction && 
        lastInteraction.action === 'clear' && 
        (lastInteraction.task === 'dfs' || lastInteraction.zone === 'global_clear')) {
      setUserDrawings([]);
      drawVisualization();
      setFeedback('Canvas cleared. Draw on the nodes to show DFS visit order.');
      setFeedbackType('info');
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
    for (const [zoneName, zone] of Object.entries(dfsZones)) {
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
    let zoneHits: Record<string, number> = {};
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
    
    setIsDrawing(true);
    setLastX(x);
    setLastY(y);
    setUserDrawings(prev => [...prev, [{x, y}]]);
  }, [isDrawingMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add point to current stroke
    setUserDrawings(prev => {
      const newDrawings = [...prev];
      const currentStroke = newDrawings[newDrawings.length - 1];
      currentStroke.push({x, y});
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
      
      onInteraction({
        task: 'dfs',
        action: 'draw',
        x: Math.round(x),
        y: Math.round(y),
        zone: zone.name,
      });
      
      // Update feedback based on drawing
      const zoneData = dfsZones[zone.name as keyof typeof dfsZones];
      if (zoneData && typeof zoneData.correct === 'number') {
        setFeedback(`✅ Great drawing! You drew on node ${zone.name.replace('node', '')} (visit order ${zoneData.correct})`);
        setFeedbackType('correct');
      } else {
        setFeedback(`Try drawing on a specific node. You drew in ${zone.name}`);
        setFeedbackType('incorrect');
      }
    }
  }, [isDrawing, isDrawingMode, userDrawings, analyzeDrawing, onInteraction]);

  // Initialize canvas
  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]);

  const getFeedbackStyles = () => {
    switch (feedbackType) {
      case 'correct':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'incorrect':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-white" style={{ paddingBottom: `${terminalHeight}vh` }}>
      <div className="text-center max-w-4xl mx-auto p-6">  
        <p className="text-gray-600 mb-6">
          Number the nodes in the order that Depth-First Search would visit them using the draw tool above.
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

export default DFSVisualizationOverlay;