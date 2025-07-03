'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle initial routing
      if (!session) {
        // Only redirect to login if not already on auth pages
        if (!pathname.startsWith('/auth/')) {
          router.push('/auth/login');
        }
      } else if (pathname === '/' || pathname === '/auth/login') {
        // Redirect authenticated users away from login pages
        router.push('/dashboard');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session) {
        // Only redirect to login if not already on auth pages
        if (!pathname.startsWith('/auth/')) {
          router.push('/auth/login');
        }
      } else if (event === 'SIGNED_IN') {
        // Redirect to dashboard when user signs in
        router.push('/dashboard');
      }
      // For other events (like TOKEN_REFRESHED), preserve the current URL
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Allow access to auth pages even when not authenticated
  if (!user && pathname.startsWith('/auth/')) {
    return (
      <AuthContext.Provider value={{ user, session, loading }}>
        {children}
      </AuthContext.Provider>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}