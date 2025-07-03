'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

interface CreateCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCycleModal({ open, onOpenChange, onSuccess }: CreateCycleModalProps) {
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate default label based on current date
  const generateDefaultLabel = () => {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil(
      (now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return `${year}-W${week.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('create_deployment_cycle', {
        p_label: label.trim(),
      });

      if (error) throw error;

      toast.success('Deployment cycle created! Services from the most recent cycle have been automatically added.');
      setLabel('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create deployment cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (newOpen) {
        setLabel(generateDefaultLabel());
      } else {
        setLabel('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deployment Cycle</DialogTitle>
          <DialogDescription>
            Create a new deployment cycle to coordinate service releases.
            Services from your most recent cycle will be automatically copied over with their dependencies.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., 2025-W28"
                className="col-span-3"
                required
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-md text-sm">
              <strong>Note:</strong> All services and dependencies from your most recent cycle 
              will be automatically added to this new cycle in "not_ready" state. You can add 
              or remove services later if needed.
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !label.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:transform-none disabled:hover:scale-100"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Cycle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}