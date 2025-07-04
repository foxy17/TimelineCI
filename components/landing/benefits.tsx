import { CheckCircle, BarChart3, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GetStartedButton } from "./get-started-button"

export function LandingBenefits() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-grid-pattern-subtle"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-purple-50/40"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900">
                Reduce Deployment Time by 60%
              </h2>
              <p className="max-w-[600px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Teams using Timelin-CI report significantly faster deployment cycles and fewer production issues.
              </p>
            </div>
            <ul className="grid gap-3 py-4">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700">
                  Eliminate deployment bottlenecks with clear dependency visualization
                </span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700">Reduce rollbacks with comprehensive pre-deployment checks</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700">
                  Improve team coordination with shared visibility and notifications
                </span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700">Scale confidently with automated dependency management</span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row w-full max-w-sm">
              <GetStartedButton size="lg" className="h-12 px-8 w-full sm:w-auto">
                Start Your Free Trial
              </GetStartedButton>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 bg-white/70 backdrop-blur-sm border-indigo-200 hover:bg-white/90 w-full sm:w-auto"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
          <div className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last">
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border border-indigo-200 rounded-xl relative">
              <div className="absolute inset-0 bg-grid-pattern-subtle opacity-30"></div>
              <div className="text-center space-y-4 relative z-10">
                <BarChart3 className="h-16 w-16 mx-auto text-indigo-600" />
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gray-900">60% Faster</div>
                  <div className="text-sm text-gray-600">Average deployment time reduction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 