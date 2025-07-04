import { BarChart3 } from "lucide-react"

export function LandingDashboardPreview() {
  return (
    <section className="w-full py-12 md:py-16 relative">
      {/* Colorful grid background */}
      <div className="absolute inset-0 bg-grid-pattern-subtle"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 to-blue-50/30"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        <div className="flex flex-col items-center space-y-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900">
              See Your Deployments in Action
            </h2>
            <p className="text-gray-600 max-w-[600px] mx-auto text-lg">
              Get instant visibility into your deployment pipeline with our intuitive dashboard
            </p>
          </div>

          {/* Enhanced Screenshot placeholder */}
          <div className="w-full max-w-6xl mx-auto">
            <div className="relative rounded-xl border border-indigo-200 bg-white shadow-2xl overflow-hidden">
              {/* Perfect container for your dashboard screenshot */}
              <div className="aspect-[16/9] bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center relative">
                {/* Subtle grid overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>

                {/* Placeholder content - replace with your screenshot */}
                <div className="text-center space-y-6 p-8 relative z-10">
                  <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-indigo-600" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-gray-900">Dashboard Screenshot</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Replace this placeholder with your actual dashboard screenshot showing microservices
                      deployment cycles
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 