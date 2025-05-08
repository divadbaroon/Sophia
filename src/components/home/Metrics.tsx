import { LineChart, Brain, Users } from "lucide-react"

interface MetricsSectionProps {
  isVisible: boolean;
}

export default function MetricsSection({ isVisible }: MetricsSectionProps) {
  const metrics = [
    {
      icon: <LineChart className="w-12 h-12 mb-4 text-blue-600" />,
      value: "43%",
      label: "Fewer questions to identify misconceptions",
    },
    {
      icon: <Brain className="w-12 h-12 mb-4 text-blue-600" />,
      value: "22%",
      label: "Shorter perceived conversation length",
    },
    {
      icon: <Users className="w-12 h-12 mb-4 text-blue-600" />,
      value: "5/5",
      label: "Expert educator recommendation rating",
    },
  ]

  return (
    <section id="metrics" className="py-16 relative overflow-hidden mt-6">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white opacity-50" />
      <h3 className="text-4xl font-bold mb-16 text-center">Proven Results in CS Education</h3>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`transform transition-all duration-700 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              } bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow duration-200`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="flex justify-center">{metric.icon}</div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{metric.value}</p>
              <p className="text-gray-600">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}