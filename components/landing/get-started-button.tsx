'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GetStartedButtonProps {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
  children?: React.ReactNode;
}

export function GetStartedButton({
  variant = 'default',
  size = 'lg',
  className,
  children = 'Get Started',
}: GetStartedButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      // Fallback to login page on error
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={cn(
        variant === 'default' && 'bg-indigo-600 hover:bg-indigo-700 text-white',
        className
      )}
    >
      {children}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}
