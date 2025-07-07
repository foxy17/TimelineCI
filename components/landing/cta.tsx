import { GetStartedButton } from './get-started-button';

export function LandingCTA() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/80 to-purple-50/60"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-4 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
              Ready to Transform Your Deployments?
            </h2>
            <p className="mx-auto max-w-[600px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join thousands of development teams who trust Timelin-CI to gain visibility into their
              microservices deployments.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <GetStartedButton size="lg" className="w-full h-12">
              Start Free Trial
            </GetStartedButton>
            <p className="text-xs text-gray-500">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
