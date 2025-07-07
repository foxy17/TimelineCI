'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      // Handle error parameters first
      if (error) {
        if (error === 'auth_callback_error') {
          toast.error('Authentication failed. Please try again.');
        } else if (error === 'unexpected_error') {
          toast.error('An unexpected error occurred during authentication.');
        }
        return;
      }

      // Handle authentication code
      if (code) {
        const supabase = createClient();
        
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Auth callback error:', exchangeError);
            toast.error('Authentication failed. Please try again.');
            router.push('/auth/login?error=auth_callback_error');
          } else {
            // Successful authentication
            toast.success('Successfully signed in!');
            
            // Clean up URL by removing the code parameter
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            window.history.replaceState({}, '', url.toString());
            
            // Redirect to dashboard
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Unexpected error during auth callback:', error);
          toast.error('An unexpected error occurred during authentication.');
          router.push('/auth/login?error=unexpected_error');
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  return null; // This component doesn't render anything
} 