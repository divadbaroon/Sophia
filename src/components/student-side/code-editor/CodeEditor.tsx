'use client'

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { useFile } from '@/lib/context/FileContext';
import { EditorView } from '@codemirror/view';
import { ViewUpdate } from '@uiw/react-codemirror';
import { SelectionRange, Extension, Range } from '@codemirror/state';
import { Decoration } from '@codemirror/view';
import { indentUnit } from '@codemirror/language';
import { saveCodeSnapshot } from '@/lib/actions/code-snapshot-actions';
import TreeVisualization, { TreeNode } from '@/components/student-side/visualizations/binaryTree';

import { CodeEditorRef, CodeEditorProps } from "@/types"
import { DEFAULT_FONT_SIZE } from "@/lib/constants"

// Local storage keys for zoom level and drawings
const LOCAL_STORAGE_ZOOM_KEY = 'code_editor_zoom_level';
const LOCAL_STORAGE_DRAWING_KEY_PREFIX = 'drawing_annotations_';
const LOCAL_STORAGE_VISUALIZATION_KEY = 'visualization_visible';

// Drawing types
interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  width: number;
}

interface StencilPosition {
  x: number;
  y: number;
}

type StencilType = 'arrow' | 'circle' | 'rectangle';

// Generate template for only the current active method
const generateCurrentMethodTemplate = (methodsCode: Record<string, string>, activeMethodId: string): string => {
  if (!activeMethodId || !methodsCode[activeMethodId]) {
    return '';
  }
  
  return methodsCode[activeMethodId].trim();
};

// Create a custom extension for line highlighting
const createLineHighlightExtension = (lineNumber: number) => {
  const highlightLine = Decoration.line({
    attributes: { class: "bg-yellow-100" } 
  });

  return EditorView.decorations.of((view) => {
    const decorations: Range<Decoration>[] = []; 
    
    // Ensure lineNumber is valid
    if (lineNumber > 0 && lineNumber <= view.state.doc.lines) {
      const line = view.state.doc.line(lineNumber);
      decorations.push(highlightLine.range(line.from));
    }
    
    return Decoration.set(decorations);
  });
};

// Create a custom extension for font size
const createFontSizeExtension = (fontSize: number) => {
  return EditorView.theme({
    "&": {
      fontSize: `${fontSize}px`
    }
  });
};

// Convert to forwardRef to expose the ref interface
const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({ className = '', readOnly = false }, ref) => {
  const { 
    updateCachedFileContent, 
    setFileContent, 
    updateHighlightedText,
    sessionId,
    activeMethodId,
    lessonId,
    currentMethodIndex,
    methodsCode,       
    updateMethodsCode,
  } = useFile();

  
  const editorViewRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [localHighlightedText, setLocalHighlightedText] = useState<string>('');
  const [highlightedLineNumber, setHighlightedLineNumber] = useState<number | null>();
  const [fontSize, setFontSize] = useState<number>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [drawingColor, setDrawingColor] = useState<string>('#ff0000');
  const [drawingWidth, setDrawingWidth] = useState<number>(2);
  
  // Stencil state
  const [selectedStencil, setSelectedStencil] = useState<StencilType | null>(null);
  const [stencilStart, setStencilStart] = useState<StencilPosition | null>(null);
  
  // Visualization state
  const [showVisualization, setShowVisualization] = useState<boolean>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_VISUALIZATION_KEY);
    return saved ? JSON.parse(saved) : false;
  });
  const [treeRoot] = useState<TreeNode | null>({
    value: 4,
    left: {
      value: 2,
      left: {
        value: 1,
        left: null,
        right: null,
      },
      right: {
        value: 3,
        left: null,
        right: null,
      },
    },
    right: {
      value: 6,
      left: {
        value: 5,
        left: null,
        right: null,
      },
      right: {
        value: 7,
        left: null,
        right: null,
      },
    },
  });
  
  // Function to highlight a specific line by line number
  const highlightLineByNumber = useCallback((lineNumber: number) => {
    console.log("Highlighting line:", lineNumber);
    setHighlightedLineNumber(lineNumber);
    
    // Optionally, also scroll to this line
    if (editorViewRef.current) {
      const state = editorViewRef.current.state;
      if (lineNumber > 0 && lineNumber <= state.doc.lines) {
        const line = state.doc.line(lineNumber);
        
        // Create a selection at the start of the line
        const selection = { anchor: line.from, head: line.from };
        
        // Dispatch a transaction to update selection and scroll to it
        editorViewRef.current.dispatch({
          selection,
          scrollIntoView: true
        });
      }
    }
  }, []);
  
  // Function to clear the highlighted line
  const clearHighlightedLine = useCallback(() => {
    console.log("Clearing highlighted line");
    setHighlightedLineNumber(null);
  }, []);

  // Add zoom functions
  const zoomIn = useCallback(() => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 1, 30); // Cap at 30px
      localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(newSize));
      return newSize;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 1, 8); // Don't go below 8px
      localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(newSize));
      return newSize;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE);
    localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, String(DEFAULT_FONT_SIZE));
  }, []);

  // Clear drawing functions
  // Drawing functions
  const toggleDrawing = useCallback(() => {
    setIsDrawingMode(prev => !prev);
  }, []);

  const clearDrawing = useCallback(() => {
    setDrawingStrokes([]);
    setCurrentStroke([]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    // Save empty drawing state
    if (sessionId && activeMethodId) {
      try {
        const storageKey = `${LOCAL_STORAGE_DRAWING_KEY_PREFIX}${sessionId}_${activeMethodId}`;
        localStorage.setItem(storageKey, JSON.stringify([]));
      } catch (err) {
        console.error("Error saving drawing to localStorage:", err);
      }
    }
  }, [sessionId, activeMethodId]);

  const setDrawingColorRef = useCallback((color: string) => {
    setDrawingColor(color);
  }, []);

  const setDrawingWidthRef = useCallback((width: number) => {
    setDrawingWidth(width);
  }, []);

  // Visualization functions
  const toggleVisualization = useCallback(() => {
    const newState = !showVisualization;
    setShowVisualization(newState);
    localStorage.setItem(LOCAL_STORAGE_VISUALIZATION_KEY, JSON.stringify(newState));
  }, [showVisualization]);

  // Save current method to database
  const saveCurrentMethod = useCallback(async () => {
    if (!activeMethodId || !sessionId || !lessonId || currentMethodIndex === undefined) {
      return;
    }

    // Get the current code content from the editor view
    const currentCode = editorViewRef.current?.state.doc.toString() || '';
    
    try {
      await saveCodeSnapshot({
        sessionId,
        lessonId,
        taskIndex: currentMethodIndex,
        methodId: activeMethodId,
        codeContent: currentCode  
      });
      console.log(`✅ Saved code for method: ${activeMethodId}`);
    } catch (error) {
      console.error(`❌ Failed to save code for method ${activeMethodId}:`, error);
    } 
  }, [activeMethodId, sessionId, lessonId, currentMethodIndex]);

  // Manual save function (exposed via ref)
  const manualSave = useCallback(async () => {
    if (activeMethodId && editorViewRef.current) {
      const currentCode = editorViewRef.current.state.doc.toString();
      updateMethodsCode(activeMethodId, currentCode);
    }
    await saveCurrentMethod();
  }, [activeMethodId, updateMethodsCode, saveCurrentMethod]);
  
  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    highlightLine: highlightLineByNumber,
    clearHighlight: clearHighlightedLine, 
    zoomIn,
    zoomOut,
    resetZoom,
    saveCode: manualSave,
    toggleDrawing,
    clearDrawing,
    setDrawingColor: setDrawingColorRef,
    setDrawingWidth: setDrawingWidthRef,
    toggleVisualization
  }), [highlightLineByNumber, clearHighlightedLine, zoomIn, zoomOut, resetZoom, manualSave, toggleDrawing, clearDrawing, setDrawingColorRef, setDrawingWidthRef, toggleVisualization]);

  // Canvas drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Clear all drawings
  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  // Check if we're clicking on a button area (top 60px of canvas)
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  
  if (y < 60) {
    // Don't start drawing if clicking in button area
    return;
  }
  
  if (!isDrawingMode && !selectedStencil) return;
  
  setIsDrawing(true);
  const canvas = canvasRef.current;
  if (!canvas) return;

  const rect2 = canvas.getBoundingClientRect();
  const x = e.clientX - rect2.left;
  const y2 = e.clientY - rect2.top;

  if (selectedStencil) {
    setStencilStart({ x, y: y2 });
  } else {
    // Start a new stroke with the initial point
    setCurrentStroke([{ x, y: y2 }]);
    console.log('✏️ Drawing Started at:', { x: x.toFixed(1), y: y2.toFixed(1) });
  }
}, [isDrawingMode, selectedStencil]);

// Update your draw function with improved tracking
const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDrawing || (!isDrawingMode && !selectedStencil)) return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Log drawing direction with better angle detection
  if (currentStroke.length > 0) {
    const lastPoint = currentStroke[currentStroke.length - 1];
    const deltaX = x - lastPoint.x;
    const deltaY = y - lastPoint.y;
    
    // Calculate distance to ensure we have meaningful movement
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 5) { // Only log if movement is significant
      // Calculate angle in degrees
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Determine primary direction based on angle
      let direction = '';
      
      if (angle >= -22.5 && angle < 22.5) {
        direction = 'RIGHT →';
      } else if (angle >= 22.5 && angle < 67.5) {
        direction = 'DOWN-RIGHT ↘';
      } else if (angle >= 67.5 && angle < 112.5) {
        direction = 'DOWN ↓';
      } else if (angle >= 112.5 && angle < 157.5) {
        direction = 'DOWN-LEFT ↙';
      } else if (angle >= 157.5 || angle < -157.5) {
        direction = 'LEFT ←';
      } else if (angle >= -157.5 && angle < -112.5) {
        direction = 'UP-LEFT ↖';
      } else if (angle >= -112.5 && angle < -67.5) {
        direction = 'UP ↑';
      } else if (angle >= -67.5 && angle < -22.5) {
        direction = 'UP-RIGHT ↗';
      }
      
      console.log(`✏️ Drawing Direction: ${direction} (angle: ${angle.toFixed(1)}°)`);
    }
  }

  if (selectedStencil && stencilStart) {
    // Clear and redraw for stencils
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw existing strokes
    drawingStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });

    // Draw current stencil
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = drawingWidth;
    
    switch (selectedStencil) {
      case 'arrow':
        drawArrow(ctx, stencilStart.x, stencilStart.y, x, y);
        break;
      case 'circle':
        const radius = Math.sqrt(Math.pow(x - stencilStart.x, 2) + Math.pow(y - stencilStart.y, 2));
        ctx.beginPath();
        ctx.arc(stencilStart.x, stencilStart.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(stencilStart.x, stencilStart.y, x - stencilStart.x, y - stencilStart.y);
        ctx.stroke();
        break;
    }
  } else {
    // Regular drawing - always add point regardless of angle
    setCurrentStroke(prev => [...prev, { x, y }]);
    
    // Clear and redraw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all existing strokes
    drawingStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
    
    // Draw current stroke - ensure we always draw even with just 2 points
    if (currentStroke.length > 0) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      
      // Draw line even if we only have one point (from start to current)
      if (currentStroke.length === 1) {
        ctx.lineTo(x, y);
      } else {
        for (let i = 1; i < currentStroke.length; i++) {
          ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
      }
      
      ctx.stroke();
    }
  }
}, [isDrawing, isDrawingMode, selectedStencil, stencilStart, drawingColor, drawingWidth, drawingStrokes, currentStroke]);

// Update stopDrawing to ensure even short strokes are saved
const stopDrawing = useCallback((e?: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDrawing) return;
  
  setIsDrawing(false);

  if (selectedStencil && stencilStart && e) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create stroke for the stencil
    const stencilStroke: DrawingStroke = {
      points: [stencilStart, { x, y }],
      color: drawingColor,
      width: drawingWidth
    };

    setDrawingStrokes(prev => [...prev, stencilStroke]);
    setStencilStart(null);
  } else if (currentStroke.length >= 1) { // Changed from > 1 to >= 1
    // Save even single point strokes (clicks)
    const newStroke: DrawingStroke = {
      points: [...currentStroke],
      color: drawingColor,
      width: drawingWidth
    };
    
    setDrawingStrokes(prev => [...prev, newStroke]);
    console.log('✏️ Drawing Ended - Stroke saved with', currentStroke.length, 'points');
    setCurrentStroke([]);
  }
}, [isDrawing, selectedStencil, stencilStart, drawingColor, drawingWidth, currentStroke]);

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all strokes
    drawingStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
    
    // Also draw current stroke if exists
    if (currentStroke.length > 1) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      
      ctx.stroke();
    }
  }, [drawingStrokes, currentStroke, drawingColor, drawingWidth]);

  const saveDrawingToStorage = useCallback(() => {
    if (!sessionId || !activeMethodId) return;
    
    try {
      const storageKey = `${LOCAL_STORAGE_DRAWING_KEY_PREFIX}${sessionId}_${activeMethodId}`;
      localStorage.setItem(storageKey, JSON.stringify(drawingStrokes));
    } catch (err) {
      console.error("Error saving drawing to localStorage:", err);
    }
  }, [sessionId, activeMethodId, drawingStrokes]);

  const loadDrawingFromStorage = useCallback(() => {
    if (!sessionId || !activeMethodId) return;
    
    try {
      const storageKey = `${LOCAL_STORAGE_DRAWING_KEY_PREFIX}${sessionId}_${activeMethodId}`;
      const savedDrawing = localStorage.getItem(storageKey);
      
      if (savedDrawing) {
        const parsedDrawing = JSON.parse(savedDrawing);
        setDrawingStrokes(parsedDrawing);
      } else {
        setDrawingStrokes([]);
      }
    } catch (err) {
      console.error("Error loading drawing from localStorage:", err);
      setDrawingStrokes([]);
    }
  }, [sessionId, activeMethodId]);

  // Setup canvas size
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = editorContainerRef.current;
    
    if (!canvas || !container) return;
    
    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Redraw after resize
    redrawCanvas();
  }, [redrawCanvas]);

  // Memoize custom extensions
  const customExtensions = useMemo(() => {
    const extensions: Extension[] = [
      // Add font size extension
      createFontSizeExtension(fontSize),
      // Set indentation to 4 spaces for Python
      indentUnit.of("    ")
    ];
    
    if (highlightedLineNumber !== null && highlightedLineNumber !== undefined) {
      extensions.push(createLineHighlightExtension(highlightedLineNumber));
    }
    
    return extensions;
  }, [highlightedLineNumber, fontSize]);

  // Handle updates from CodeMirror including selection changes
  const handleEditorUpdate = useCallback((viewUpdate: ViewUpdate): void => {
    // Only store the editor view reference if it has actually changed
    if (viewUpdate.view !== editorViewRef.current) {
      editorViewRef.current = viewUpdate.view;
    }
    
    // Check if this update includes selection changes
    if (viewUpdate.selectionSet && !isDrawingMode) {
      const selection = viewUpdate.state.selection.main;
      handleSelectionChange(selection);
    }
  }, [isDrawingMode]);
  
  const handleSelectionChange = useCallback((selection: SelectionRange): void => {
    // Prevent unnecessary state updates if selection hasn't meaningfully changed
    if (selection.from !== selection.to) {
      // There is a selection
      const selectedText = editorViewRef.current?.state.sliceDoc(selection.from, selection.to) || '';
      
      // Only update if the selected text is different from the current selection
      if (selectedText !== localHighlightedText) {
        // Update local state
        setLocalHighlightedText(selectedText);
        
        // Update file context
        if (typeof updateHighlightedText === 'function') {
          updateHighlightedText(selectedText);
        }
      }
    } else if (localHighlightedText !== '') {
      // Clear selection if it was previously set
      setLocalHighlightedText('');
      
      if (typeof updateHighlightedText === 'function') {
        updateHighlightedText('');
      }
    }
  }, [localHighlightedText, updateHighlightedText]);

  const handleCodeChange = useCallback((value: string): void => {
    console.log('Code change for method:', activeMethodId, 'value length:', value.length);
    
    // Update fileContent immediately for the editor
    setFileContent(value); 
    
    // Use context function instead of local state
    if (activeMethodId) {
      updateMethodsCode(activeMethodId, value);
    }
    
    // Update cached content immediately
    updateCachedFileContent(value);

    // Debounced auto-save to database
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (activeMethodId && sessionId && lessonId && currentMethodIndex !== undefined) {
        saveCodeSnapshot({
          sessionId,
          lessonId,
          taskIndex: currentMethodIndex,
          methodId: activeMethodId,
          codeContent: value
        }).catch(error => {
          console.error("Auto-save failed:", error);
        });
      }
    }, 3000); // Save after 3 seconds of idle time
  }, [activeMethodId, sessionId, lessonId, currentMethodIndex, setFileContent, updateMethodsCode, updateCachedFileContent]);

  // Add keyboard event listener for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S (or Cmd+S on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        manualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [manualSave]);

  // Add event listener for wheel events to handle zooming
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl key is pressed and not in drawing mode
      if (e.ctrlKey && !isDrawingMode) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
          // Zoom in (wheel up)
          zoomIn();
        } else {
          // Zoom out (wheel down)
          zoomOut();
        }
      }
    };
    
    // Add the event listener to the editor container
    const container = editorContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    // Cleanup function
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoomIn, zoomOut, isDrawingMode]);

  // Setup canvas and load drawings when component mounts or activeMethodId changes
  useEffect(() => {
    setTimeout(() => {
      setupCanvas();
      loadDrawingFromStorage();
    }, 100);
  }, [activeMethodId, setupCanvas, loadDrawingFromStorage]);

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [drawingStrokes, redrawCanvas]);

  // Save drawing when strokes change
  useEffect(() => {
    saveDrawingToStorage();
  }, [drawingStrokes, saveDrawingToStorage]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setupCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Use context methodsCode instead of local state and isInitialized
  const currentMethodCode = activeMethodId && methodsCode[activeMethodId] ? 
    generateCurrentMethodTemplate(methodsCode, activeMethodId) : '';

  // Debug logging
  useEffect(() => {
    console.log('CodeEditor Debug:', {
      sessionId,
      activeMethodId,
      methodsCodeKeys: Object.keys(methodsCode),
      currentMethodCode: currentMethodCode?.substring(0, 50) + '...',
      hasMethodCode: !!methodsCode[activeMethodId]
    });
  }, [sessionId, activeMethodId, methodsCode, currentMethodCode]);

  return (
    <div 
      className={`h-full flex flex-col relative ${className}`}
      ref={editorContainerRef}
    >
      
      <ScrollArea className="flex-1">
        <CodeMirror
          key={`${sessionId}-${activeMethodId}`} // Force re-render when session or method changes
          value={currentMethodCode}
          height="640px"
          theme={vscodeLight}
          extensions={[python(), ...customExtensions]}
          onChange={handleCodeChange}
          onUpdate={handleEditorUpdate}
          readOnly={readOnly || isDrawingMode} // Make editor read-only when drawing
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: false,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: false,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </ScrollArea>

      {/* Binary Tree Visualization Overlay */}
      {showVisualization && <TreeVisualization treeRoot={treeRoot} />}

      {/* Drawing Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-50 ${
          isDrawingMode || selectedStencil ? 'cursor-crosshair' : 'pointer-events-none'
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ 
          pointerEvents: isDrawingMode || selectedStencil ? 'auto' : 'none',
          // Create a "hole" in the canvas for the button area
          clipPath: 'polygon(0 60px, 100% 60px, 100% 100%, 0 100%)'
        }}
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;