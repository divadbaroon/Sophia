import { ArrowRight } from "lucide-react"

export default function CallToAction() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
          opacity: 0.1,
        }}
      />
      <div className="container mx-auto px-6 text-center relative">
        <h3 className="text-4xl font-bold mb-8 text-white">Transform Computer Science Education</h3>
        <p className="text-xl mb-12 text-blue-100 max-w-2xl mx-auto">
          Join our pilot program and experience how Sophia&apos;s concept map-guided questioning can help you identify student misconceptions with 43% fewer questions.
        </p>
        <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
          Enhance Your Teaching Today
          <ArrowRight className="ml-2" />
        </button>
      </div>
    </section>
  )
}