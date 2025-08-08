'use client'

import { useState, useCallback, useEffect } from 'react'
import { DEFAULT_FONT_SIZE } from '@/lib/constants/code-editor-font'

export const useEditorZoom = (editorContainerRef: React.RefObject<HTMLDivElement | null>) => {
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE)

  const zoomIn = useCallback(() => {
    setFontSize(prev => Math.min(prev + 1, 30))
  }, [])

  const zoomOut = useCallback(() => {
    setFontSize(prev => Math.max(prev - 1, 8))
  }, [])

  const resetZoom = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE)
  }, [])

  // Add event listener for wheel events to handle zooming
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl key is pressed
      if (e.ctrlKey) {
        e.preventDefault()
        
        if (e.deltaY < 0) {
          // Zoom in (wheel up)
          zoomIn()
        } else {
          // Zoom out (wheel down)
          zoomOut()
        }
      }
    }
    
    // Add the event listener to the editor container
    const container = editorContainerRef.current
    if (container) { 
      container.addEventListener('wheel', handleWheel, { passive: false })
    }
    
    // Cleanup function
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [zoomIn, zoomOut, editorContainerRef])

  return {
    fontSize,
    zoomIn,
    zoomOut,
    resetZoom
  }
}