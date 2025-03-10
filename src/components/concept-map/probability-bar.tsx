interface ProbabilityBarProps {
    probability: number
    colorIndex: number
    showFullBar?: boolean
  }
  
  // Array of colors for different concept categories
  const colors = [
    "bg-emerald-400", // OOP - green
    "bg-pink-400", // Data Structures - pink
    "bg-teal-400", // Algorithms - teal
    "bg-indigo-600", // Functional Programming - indigo
    "bg-green-600", // Concurrency - dark green
    "bg-blue-400", // Memory Management - blue
    "bg-purple-500", // Design Patterns - purple
    "bg-amber-500", // Web Development - amber
    "bg-cyan-400", // Database - cyan
    "bg-rose-400", // Version Control - rose
    "bg-orange-400", // Security - orange
  ]
  
  export default function ProbabilityBar({ probability, colorIndex, showFullBar = false }: ProbabilityBarProps) {
    // Calculate width based on probability (max width is 400px)
    const width = probability * 400
  
    // Choose color based on colorIndex
    const barColor = colorIndex >= 0 ? colors[colorIndex % colors.length] : ""
  
    return (
      <div className="relative h-5 w-[400px] bg-gray-200 flex-shrink-0">
        {showFullBar ? (
          // For the root node, show a gradient of all colors
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 via-pink-400 to-indigo-600"
            style={{ width: `${width}px` }}
          />
        ) : (
          // For regular nodes, show their specific color
          <div className={`absolute top-0 left-0 h-full ${barColor}`} style={{ width: `${width}px` }} />
        )}
      </div>
    )
  }
  
  