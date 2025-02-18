import { ArrowRight } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="pt-32 pb-16 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, blue 1px, transparent 0)",
          backgroundSize: "40px 40px",
          opacity: 0.1,
        }}
      />
      <div className="container mx-auto text-center relative">
        <div className="inline-block mb-6 px-6 py-2 bg-blue-100 rounded-full">
          <span className="text-blue-600 font-semibold">AI-Powered Office Hours</span>
        </div>
        <h2 className="text-5xl font-bold mb-6 text-gray-900">
          Transform Your<span className="text-blue-600"> Office Hours</span>
        </h2>
        <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">
          ATLAS empowers TAs with AI-driven insights and automation, helping you provide higher quality support while
          managing more students effectively.
        </p>
        <div className="space-y-4">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Start Improving Your Office Hours
            <ArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </section>
  )
}