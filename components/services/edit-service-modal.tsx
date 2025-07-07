'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { TenantService } from '@/lib/supabase';

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: TenantService | null;
  onSuccess: () => void;
}

export function EditServiceModal({
  open,
  onOpenChange,
  service,
  onSuccess,
}: EditServiceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when service changes or modal opens
  useEffect(() => {
    if (service && open) {
      setName(service.name);
      setDescription(service.description || '');
    }
  }, [service, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !name.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('update_microservice', {
        p_service_id: service.id,
        p_name: name.trim(),
        p_description: description.trim(),
      });

      if (error) throw error;

      toast.success('Service updated successfully!');
      onSuccess();
    } catch (error: any) {
      if (error.message?.includes('SERVICE_NAME_ALREADY_EXISTS')) {
        toast.error('A service with this name already exists');
      } else if (error.message?.includes('SERVICE_NAME_REQUIRED')) {
        toast.error('Service name is required');
      } else {
        toast.error(error.message || 'Failed to update service');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setName('');
        setDescription('');
      }
    }
  };

  const hasChanges =
    service && (name.trim() !== service.name || description.trim() !== (service.description || ''));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update the service name and description. Changes will be applied across all deployment
            cycles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., auth-service"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the service..."
                rows={3}
              />
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
            <Button type="submit" disabled={loading || !name.trim() || !hasChanges}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
