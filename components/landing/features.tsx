import { CheckCircle, Users, Target, BarChart3, Clock, Shield, Network } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LandingFeatures() {
  return (
    <section id="features" className="w-full py-16 md:py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-indigo-50/40"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900">
            Everything You Need for Deployment Success
          </h2>
          <p className="max-w-[900px] mx-auto text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Built for modern development teams who need to coordinate complex microservices deployments
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-indigo-100 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                <Network className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-gray-900">Service Dependencies</CardTitle>
              <CardDescription className="text-gray-600">
                Define and visualize complex interdependencies between your microservices with an intuitive graph
                interface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Dependency mapping</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Circular dependency detection</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Impact analysis</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-purple-100 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-gray-900">Deployment Cycles</CardTitle>
              <CardDescription className="text-gray-600">
                Create multiple deployment cycles with different service combinations and deployment strategies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Multi-environment support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Rollback strategies</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Parallel deployments</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-blue-100 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-gray-900">Team Collaboration</CardTitle>
              <CardDescription className="text-gray-600">
                Shared workspace where your entire organization can track progress and coordinate deployments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Role-based access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Real-time notifications</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Audit trails</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-emerald-100 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-gray-900">Real-time Monitoring</CardTitle>
              <CardDescription className="text-gray-600">
                Track deployment progress with live updates and detailed status information for each service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Live status updates</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Performance metrics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Error tracking</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-orange-100 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-gray-900">Task Management</CardTitle>
              <CardDescription className="text-gray-600">
                Assign and track tasks for each microservice with automated workflows and manual approvals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Automated workflows</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Manual approvals</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Task dependencies</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-red-100 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-gray-900">Enterprise Security</CardTitle>
              <CardDescription className="text-gray-600">
                Enterprise-grade security with SSO integration, audit logs, and compliance features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">SSO integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">SOC 2 compliant</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-gray-700">Data encryption</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
} 