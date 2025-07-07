'use client';

import { useState } from 'react';
import { DeploymentCycle } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

interface EditCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: DeploymentCycle | null;
  onSuccess: () => void;
}

export function EditCycleModal({ open, onOpenChange, cycle, onSuccess }: EditCycleModalProps) {
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle || !label.trim()) return;

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmEdit = async () => {
    if (!cycle || !label.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('update_cycle_name', {
        p_cycle_id: cycle.id,
        p_label: label.trim(),
      });

      if (error) {
        // Handle specific error messages
        if (error.message === 'CYCLE_LABEL_ALREADY_EXISTS') {
          throw new Error('A cycle with this name already exists');
        } else if (error.message === 'CANNOT_UPDATE_COMPLETED_CYCLE') {
          throw new Error('Cannot update completed cycles');
        } else if (error.message === 'CYCLE_LABEL_REQUIRED') {
          throw new Error('Cycle name is required');
        } else {
          throw error;
        }
      }

      toast.success('Cycle name updated successfully!');
      setLabel('');
      setShowConfirmation(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update cycle name');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (newOpen && cycle) {
        setLabel(cycle.label);
      } else {
        setLabel('');
        setShowConfirmation(false);
      }
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Deployment Cycle
            </DialogTitle>
            <DialogDescription>
              Update the name of this deployment cycle. The change will be reflected across all
              references to this cycle.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="label" className="text-right">
                  Name
                </Label>
                <Input
                  id="label"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g., 2025-W28"
                  className="col-span-3"
                  required
                />
              </div>
              {cycle?.completed_at && (
                <div className="bg-amber-50 p-3 rounded-md text-sm">
                  <strong>Note:</strong> This cycle has been completed. Completed cycles cannot be
                  edited to maintain deployment history integrity.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading || !label.trim() || label.trim() === cycle?.label || !!cycle?.completed_at
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Name'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cycle Name Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the cycle name from &ldquo;{cycle?.label}&rdquo; to
              &ldquo;{label.trim()}&rdquo;? This change will be reflected across all references to
              this cycle, including the deployment board and history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmation} disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEdit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Name'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
