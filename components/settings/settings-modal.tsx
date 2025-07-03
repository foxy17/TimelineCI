'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, Mail } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load user's current display name from metadata
  useEffect(() => {
    if (user && open) {
      setInitialLoading(true);
      const currentDisplayName = user.user_metadata?.full_name || '';
      setDisplayName(currentDisplayName);
      setInitialLoading(false);
    }
  }, [user, open]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
        },
      });

      if (error) {
        toast.error('Failed to update display name: ' + error.message);
      } else {
        toast.success('Display name updated successfully!');
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original value
    const currentDisplayName = user?.user_metadata?.full_name || '';
    setDisplayName(currentDisplayName);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Settings
          </DialogTitle>
          <DialogDescription>Manage your account settings and preferences.</DialogDescription>
        </DialogHeader>

        {initialLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">Email address cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={100}
              />
              <p className="text-xs text-slate-500">
                This name will be shown to other users in the system
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || initialLoading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
