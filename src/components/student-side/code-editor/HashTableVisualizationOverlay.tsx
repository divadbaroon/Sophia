'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VisualizationInteractionData } from '@/lib/context/types';
import { useCodeEditor } from '@/lib/context/codeEditor/CodeEditorProvider';

import { saveVisualizationStrokeData } from '@/lib/actions/visualization-stroke-data-actions'

interface HashTableVisualizationOverlayProps {
  onInteraction: (data: VisualizationInteractionData) => void;
  terminalHeight?: number;
  sessionId: string | null;   
  lessonId: string | null;   
}

const HashTableVisualizationOverlay: React.FC<HashTableVisualizationOverlayProps> = ({ 
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

  // Hash table zones - where students can draw (updated for cleaner layout)
  const hashZones = {
    // Correct zone: anywhere between slot 4 and node 26 (including the arrow line)
    slot4Arrow: { x1: 150, y1: 125, x2: 330, y2: 185, correct: true },
    
    // Incorrect zones (all including their respective arrow lines)
    slot1Arrow: { x1: 150, y1: 55, x2: 250, y2: 95, correct: false }, // Between slot 1 and 12
    slot7Arrow: { x1: 150, y1: 247, x2: 250, y2: 287, correct: false }, // Between slot 7 and 18
    node26To4Arrow: { x1: 450, y1: 125, x2: 570, y2: 185, correct: false }, // Between 26 and 4
    afterNode4: { x1: 620, y1: 125, x2: 700, y2: 185, correct: false }, // After node 4 (smaller area now)
    
    elsewhere: { correct: false }
  };

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw hash table slots with linked chain visualization
    ctx.font = '14px Arial';
    ctx.lineWidth = 2;

    // Draw hash table slots (left column with rounded corners)
    for (let i = 0; i <= 10; i++) {
      const x = 50;
      const y = 30 + i * 32;
      
      // All slots have white background
      ctx.fillStyle = 'white';
      
      // Draw rounded rectangle for slot
      ctx.beginPath();
      ctx.roundRect(x, y, 50, 28, 4);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();
      
      // Draw slot number in black
      ctx.fillStyle = 'black';
      ctx.fillText(i.toString(), x + 20, y + 18);
    }

    // Draw existing chains with proper linked list style and arrow heads
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Slot 1 -> 12 (with arrowhead)
    const slot1Y = 30 + 1 * 32;
    // Arrow from slot
    ctx.beginPath();
    ctx.moveTo(100, slot1Y + 14);
    ctx.lineTo(195, slot1Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(195, slot1Y + 14);
    ctx.lineTo(190, slot1Y + 9);
    ctx.moveTo(195, slot1Y + 14);
    ctx.lineTo(190, slot1Y + 19);
    ctx.stroke();
    // Draw 12 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(200, slot1Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('12', 220, slot1Y + 16);

    // Slot 7 -> 18 (with arrowhead)
    const slot7Y = 30 + 7 * 32;
    // Arrow from slot
    ctx.beginPath();
    ctx.moveTo(100, slot7Y + 14);
    ctx.lineTo(195, slot7Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(195, slot7Y + 14);
    ctx.lineTo(190, slot7Y + 9);
    ctx.moveTo(195, slot7Y + 14);
    ctx.lineTo(190, slot7Y + 19);
    ctx.stroke();
    // Draw 18 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(200, slot7Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('18', 220, slot7Y + 16);

    // Slot 4 chain: 26 -> 4 (existing chain with arrowheads)
    const slot4Y = 30 + 4 * 32;
    
    // Arrow from slot 4 to 26 (with arrowhead)
    ctx.beginPath();
    ctx.moveTo(100, slot4Y + 14);
    ctx.lineTo(345, slot4Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(345, slot4Y + 14);
    ctx.lineTo(340, slot4Y + 9);
    ctx.moveTo(345, slot4Y + 14);
    ctx.lineTo(340, slot4Y + 19);
    ctx.stroke();
    
    // Draw 26 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(350, slot4Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('26', 370, slot4Y + 16);
    
    // Arrow from 26 to 4 (with arrowhead)
    ctx.beginPath();
    ctx.moveTo(400, slot4Y + 14);
    ctx.lineTo(515, slot4Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(515, slot4Y + 14);
    ctx.lineTo(510, slot4Y + 9);
    ctx.moveTo(515, slot4Y + 14);
    ctx.lineTo(510, slot4Y + 19);
    ctx.stroke();
    
    // Draw 4 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(520, slot4Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('4', 540, slot4Y + 16);

    // Draw insertion zones (for interaction) - no visual outlines
    // Zones are invisible but still functional for hit detection
    
    // Add helpful annotations
    ctx.fillStyle = '#007bff';
    ctx.font = '14px Arial';

    // Redraw user drawings
    redrawUserDrawings(ctx);
  }, []);

  // Listen for clear actions and clear the canvas
  useEffect(() => {
    const lastInteraction = visualizationInteractions[visualizationInteractions.length - 1];
    if (lastInteraction && 
        lastInteraction.action === 'clear' && 
        (lastInteraction.task === 'hash' || lastInteraction.zone === 'global_clear')) {
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
    // Check all zones with coordinates (exclude elsewhere)
    for (const [zoneName, zone] of Object.entries(hashZones)) {
      if (zoneName === 'elsewhere') continue; // Skip elsewhere check in loop
      
      // TypeScript check: ensure zone has coordinate properties
      if ('x1' in zone && 'y1' in zone && 'x2' in zone && 'y2' in zone) {
        if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
          return { name: zoneName, zone: zone };
        }
      }
    }
    
    // Default to elsewhere if no zone matched
    return { name: 'elsewhere', zone: hashZones.elsewhere };
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

      // Save complete stroke data (with proper null checks)
      if (currentStroke.length > 1 && sessionId && lessonId) {
        saveVisualizationStrokeData({
          sessionId: sessionId,
          lessonId: lessonId,
          task: 'hash',          
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
        task: 'hash',
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
          Draw a circle where the value 15 should be inserted using collision chaining.
          <br />
        </p>
        
        <canvas 
          ref={canvasRef}
          width={800} 
          height={420}
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

export default HashTableVisualizationOverlay;