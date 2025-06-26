import React, { useRef, useEffect } from 'react'

import { VoiceCircleState } from "@/types"

interface VoiceCircleProps {
  state: VoiceCircleState
}

/**
 * VoiceCircle - Animated circle component for voice recognition states
 * Displays different animations based on the current state of voice interaction
 */
const VoiceCircle: React.FC<VoiceCircleProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Center coordinates
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) * 0.8 // Use 0.8 to make circle larger

    // Animation variables
    let rotation = 0

    // Smooth audio level simulation
    let currentAudioLevel = 0.5
    let targetAudioLevel = 0.5
    const audioLevelSmoothness = 0.15 // Lower = smoother transitions

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)
      const time = Date.now() * 0.001

      // Smoothly update audio level for listening state
      if (state === "listening") {
        // Generate a new target audio level occasionally
        if (Math.random() < 0.05) {
          targetAudioLevel = 0.3 + Math.random() * 0.7
        }

        // Smoothly interpolate towards the target
        currentAudioLevel += (targetAudioLevel - currentAudioLevel) * audioLevelSmoothness
      }

      // Draw based on state
      if (state === "idle") {
        // Simple subtle pulsing circle for idle (ChatGPT style)
        const pulseSize = 0.98 + Math.sin(time * 0.8) * 0.02

        // Draw outer circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * pulseSize, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw inner circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.85 * pulseSize, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
        ctx.lineWidth = 2.5
        ctx.stroke()
      } else if (state === "listening") {
        // Smoother ChatGPT-style listening animation

        // Base circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
        ctx.fill()

        // Animated rings that respond to audio - smoother animation
        const ringCount = 3
        for (let i = 0; i < ringCount; i++) {
          // Create smooth wave effect
          const waveOffset = Math.sin(time * (1.5 + i * 0.2)) * 0.05
          const ringRadius = radius * (0.65 + i * 0.1 + currentAudioLevel * 0.2 + waveOffset)
          const opacity = 0.4 - (i / ringCount) * 0.3

          ctx.beginPath()
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`
          ctx.lineWidth = 3
          ctx.stroke()
        }

        // Inner pulsing circle - smoother animation
        const innerPulse = 0.5 + currentAudioLevel * 0.1
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * innerPulse, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
        ctx.fill()
      } else if (state === "thinking") {
        // ChatGPT-style processing animation (spinning dots)
        rotation += 0.05

        // Draw base circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
        ctx.fill()

        // Draw spinning dots
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(rotation)

        const dotCount = 8
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2
          const dotDistance = radius * 0.7
          const dotX = Math.cos(angle) * dotDistance
          const dotY = Math.sin(angle) * dotDistance
          const dotSize = 5 + ((i % dotCount) / dotCount) * 6
          const opacity = 0.2 + (i / dotCount) * 0.6

          ctx.beginPath()
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
          ctx.fill()
        }

        ctx.restore()
      } else if (state === "initializing") {
        // Initialization animation - scanning effect with growing and shrinking circles
        
        // Draw base circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fill();
        
        // Inner pulsing circle
        const innerPulse = 0.35 + Math.sin(time * 1.5) * 0.15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * innerPulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fill();
        
        // Scanning effect - vertical moving line
        ctx.save();
        
        // Create gradient for scanning line
        const scanY = centerY + Math.sin(time * 1.2) * radius * 0.6;
        const gradient = ctx.createLinearGradient(
          centerX - radius,
          scanY,
          centerX + radius,
          scanY
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.15)");
        gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.15)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        // Create a clipping path for the scan line to only show within the circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw scan line
        ctx.beginPath();
        ctx.rect(centerX - radius, scanY - 3, radius * 2, 6);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.restore();
        
        // Expanding rings effect
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
          // Create expanding rings that reset
          const ringProgress = ((time * 0.7) + i / ringCount) % 1;
          const ringRadius = radius * (0.7 * ringProgress);
          const opacity = 0.3 * (1 - ringProgress);
          
          if (opacity > 0.01) {  // Only draw visible rings
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        
        // Rotating dots around the perimeter
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const dotCount = 6;
        const rotationSpeed = time * 0.5;
        
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2 + rotationSpeed;
          const dotDistance = radius * 0.8;
          const dotX = Math.cos(angle) * dotDistance;
          const dotY = Math.sin(angle) * dotDistance;
          const dotSize = 5;
          
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
          ctx.fill();
        }
        
        ctx.restore();
      } else if (state === "speaking") {
        // ChatGPT-style speaking animation (concentric waves)

        // Base circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
        ctx.fill()

        // Generate wave data (similar to ChatGPT's voice waves)
        const waveCount = 5

        for (let i = 0; i < waveCount; i++) {
          const waveRadius = radius * (0.6 + i * 0.1)

          ctx.beginPath()

          // Use a smoother approach for the wave points
          for (let j = 0; j <= 30; j++) {
            const angle = (j / 30) * Math.PI * 2

            // Create smooth wave effect with multiple sine waves
            const wave1 = Math.sin(angle * 3 + time * 2) * 0.03
            const wave2 = Math.sin(angle * 5 + time * 3) * 0.02
            const wave3 = Math.sin(time * (1 + i * 0.2)) * 0.05

            const height = (0.1 + wave1 + wave2 + wave3) * radius
            const x = centerX + Math.cos(angle) * (waveRadius + height)
            const y = centerY + Math.sin(angle) * (waveRadius + height)

            if (j === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }

          ctx.closePath()
          ctx.strokeStyle = `rgba(0, 0, 0, ${0.4 - i * 0.07})`
          ctx.lineWidth = 3
          ctx.stroke()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    } 

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state])

  return <canvas ref={canvasRef} className="w-full h-full rounded-full" style={{ width: "100%", height: "100%" }} />
}

export default VoiceCircle