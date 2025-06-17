import { Code, Brain, MessageCircle, BarChart3 } from "lucide-react"

export default function HowItWorksSection({ isVisible }: { isVisible: boolean }) {
  const steps = [
    {
      icon: <Code className="w-12 h-12 text-blue-600" />,
      title: "Students Practice",
      description: "Work on programming concepts through structured lessons and exercises"
    },
    {
      icon: <Brain className="w-12 h-12 text-blue-600" />,
      title: "AI Maps Understanding", 
      description: "System builds detailed concept knowledge maps as students work"
    },
    {
      icon: <MessageCircle className="w-12 h-12 text-blue-600" />,
      title: "Intelligent Help",
      description: "Students receive targeted tutoring when they get stuck"
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-blue-600" />,
      title: "Educator Insights",
      description: "Teachers get real-time misconception reports and class analytics"
    }
  ]

  return (
    <section className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-6">
        <h3 className="text-4xl font-bold mb-4 text-center">How Sophia Transforms Learning</h3>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
          A seamless cycle of practice, understanding, help, and insights
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
                <div className="flex justify-center mb-4">{step.icon}</div>
                <div className="text-2xl font-bold text-blue-600 mb-2">{index + 1}</div>
              </div>
              <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
        
        {/* Updated flow for 2x2 layout */}
        <div className="hidden md:block">
          <div className="flex justify-center items-center mt-8">
            <div className="text-gray-400">Practice → Understanding → Help → Insights</div>
          </div>
        </div>
      </div>
    </section>
  )
}