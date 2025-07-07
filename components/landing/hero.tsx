import { CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GetStartedButton } from './get-started-button';

export function LandingHero() {
  return (
    <section className="relative w-full pt-24 pb-8 md:pt-32 md:pb-12 lg:pt-40 lg:pb-16 overflow-hidden">
      {/* Colorful Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern-hero"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-blue-50/60"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-4 max-w-4xl mx-auto">
            <Badge
              variant="outline"
              className="mb-4 bg-white/70 backdrop-blur-sm border-indigo-200 text-indigo-700"
            >
              <Zap className="w-3 h-3 mr-1" />
              Deployment Visibility Made Simple
            </Badge>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-gray-900">
              Gain Complete
              <span className="text-indigo-600"> Deployment Visibility </span>
              Across Microservices
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl leading-relaxed">
              Get real-time insights into your deployment pipeline. Track dependencies, monitor
              progress, and maintain full transparency across your entire microservices ecosystem.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GetStartedButton size="lg" className="h-12 px-8">
              Start Free Trial
            </GetStartedButton>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 bg-white/70 backdrop-blur-sm border-indigo-200 hover:bg-white/90"
            >
              Watch Demo
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-emerald-500" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-emerald-500" />
              No credit card required
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
