import { Brain, Code, Lightbulb } from "lucide-react"

interface FeaturesSectionProps {
  isVisible: boolean;
}

export default function FeaturesSection({ isVisible }: FeaturesSectionProps) {
  const features = [
    {
      icon: <Brain className="w-12 h-12 mb-4 text-blue-600" />,
      title: "Dynamic Concept Mapping",
      description:
        "Continuously refines a comprehensive concept map that tracks student understanding levels, system confidence, reasoning, and recency of information.",
    },
    {
      icon: <Code className="w-12 h-12 mb-4 text-blue-600" />,
      title: "Multi-agent Architecture",
      description:
        "Dedicated concept agents, pivot agent, and orchestrator agent work together to efficiently identify and probe specific knowledge gaps.",
    },
    {
      icon: <Lightbulb className="w-12 h-12 mb-4 text-blue-600" />,
      title: "Strategic Information Gain",
      description:
        "Uses a priority-based pivot mechanism to formulate questions that maximize information gain about student misconceptions with each interaction.",
    },
  ]

  return (
    <section id="features" className="container mx-auto px-6 py-24">
      <h3 className="text-4xl font-bold mb-16 text-center">Key Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`transform transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            } border border-gray-200 p-8 rounded-2xl hover:shadow-xl transition-all duration-200 bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50`}
            style={{ transitionDelay: `${index * 200}ms` }}
          >
            <div className="flex justify-center">{feature.icon}</div>
            <h4 className="text-xl font-semibold mb-4">{feature.title}</h4>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}