"use client"

import { useState, useEffect } from "react"
import HeroSection from "@/components/home/Hero"
import MetricsSection from "@/components/home/Metrics"
import FeaturesSection from "@/components/home/Features"
import ProcessFlow from "@/components/home/ProcessFlow"
import CallToAction from "@/components/home/CallToAction"
import Footer from "@/components/home/Footer"

export default function LandingPage() {
  const [visibleSections, setVisibleSections] = useState({
    metrics: false,
    features: false,
    impact: false,
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 }
    )

    const sections = ["metrics", "features", "impact"]
    sections.forEach((section) => {
      const element = document.getElementById(section)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-black">
      <HeroSection />
      <MetricsSection isVisible={visibleSections.metrics} />
      <FeaturesSection isVisible={visibleSections.features} />
      <ProcessFlow />
      <CallToAction />
      <Footer />
    </div>
  )
}