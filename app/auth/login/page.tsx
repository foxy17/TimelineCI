import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TimelineCI</h1>
          <p className="text-slate-600">
            Coordinate deployments in teams with dependency-aware orchestration
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
