export default function ProcessFlow() {
    const steps = [
      {
        x: 50,
        y: 80,
        title: "1. Student Interaction",
        desc: "Student asks their question",
      },
      {
        x: 425,
        y: 80,
        title: "4. Probing Question",
        desc: "Probe student with question",
      },
      {
        x: 50,
        y: 210,
        title: "2. Concept Analysis",
        desc: "Generate detailed map",
      },
      {
        x: 425,
        y: 210,
        title: "3. Gap Analysis",
        desc: "Identify knowledge gaps",
      },
    ];
  
    return (
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold mb-16 text-center">How It Works</h3>
          <div className="w-full bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300 flex justify-center items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 800 500"
              className="w-full max-w-4xl h-auto"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                </marker>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
  
              {/* Background */}
              <rect width="800" height="500" fill="#F0F9FF" />
  
              {/* Title */}
              <text
                x="400"
                y="40"
                textAnchor="middle"
                fontSize="24"
                fontWeight="bold"
                fill="#1E40AF"
              >
                ATLAS: Student Interaction Flow
              </text>
  
              {/* Process Steps */}
              <g transform="translate(0, 20)">
                {steps.map((step, index) => (
                  <g key={index} transform={`translate(${step.x}, ${step.y})`}>
                    <rect
                      x="0"
                      y="0"
                      width="250"
                      height="90"
                      rx="15"
                      fill="#EFF6FF"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      filter="url(#glow)"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.8;1;0.8"
                        dur="3s"
                        repeatCount="indefinite"
                        begin={`${index * 0.5}s`}
                      />
                    </rect>
                    <text
                      x="125"
                      y="35"
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="bold"
                      fill="#1E40AF"
                    >
                      {step.title}
                    </text>
                    <text
                      x="125"
                      y="60"
                      textAnchor="middle"
                      fontSize="14"
                      fill="#3B82F6"
                    >
                      {step.desc}
                    </text>
                  </g>
                ))}
  
                {/* Connecting Lines with Animations */}
                <g stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrowhead)">
                  {/* Step 1 -> Step 2 (Vertical down) */}
                  <line x1="175" y1="170" x2="175" y2="170">
                    <animate
                      attributeName="y2"
                      from="170"
                      to="210"
                      dur="1s"
                      begin="1s"
                      fill="freeze"
                    />
                  </line>
  
                  {/* Step 2 -> Step 3 (Horizontal right) */}
                  <line x1="300" y1="250" x2="300" y2="250">
                    <animate
                      attributeName="x2"
                      from="300"
                      to="425"
                      dur="1s"
                      begin="2s"
                      fill="freeze"
                    />
                  </line>
  
                  {/* Step 3 -> Step 4 (Vertical up) */}
                  <line x1="550" y1="210" x2="550" y2="210">
                    <animate
                      attributeName="y2"
                      from="210"
                      to="170"
                      dur="1s"
                      begin="3s"
                      fill="freeze"
                    />
                  </line>
  
                  {/* Step 4 -> Step 1 (Horizontal left, completing the cycle) */}
                  <line x1="425" y1="125" x2="425" y2="125">
                    <animate
                      attributeName="x2"
                      from="425"
                      to="300"
                      dur="1s"
                      begin="4s"
                      fill="freeze"
                    />
                  </line>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </section>
    );
  }