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
        <h2 className="text-5xl font-bold mb-6 text-gray-900 mt-10">
          Meet <span className="text-blue-600">Sophia</span>
        </h2>
        <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">
          Use Sophia to identify individual student knowledge gaps at scale, providing educators with actionable insights and personalized student learning.        </p>
        <div className="space-y-4">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Get Started
            <ArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </section>
  )
}