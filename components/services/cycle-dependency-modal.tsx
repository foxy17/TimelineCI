'use client';

import { useState, useEffect } from 'react';
import { supabase, Microservice, MicroserviceDep, DeploymentCycle } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Copy } from 'lucide-react';

interface CycleDependencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Microservice;
  allServices: Microservice[];
  cycles: DeploymentCycle[];
  selectedCycleId: string;
  onSuccess: () => void;
}

export function CycleDependencyModal({
  open,
  onOpenChange,
  service,
  allServices,
  cycles,
  selectedCycleId,
  onSuccess,
}: CycleDependencyModalProps) {
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCycleId, setCurrentCycleId] = useState(selectedCycleId);
  const [copyFromCycleId, setCopyFromCycleId] = useState<string>('');

  useEffect(() => {
    if (open && currentCycleId) {
      loadDependencies();
    }
  }, [open, currentCycleId, service.id]);

  const loadDependencies = async () => {
    try {
      const { data, error } = await supabase
        .from('microservice_deps')
        .select('depends_on_service_id')
        .eq('cycle_id', currentCycleId)
        .eq('service_id', service.id);

      if (error) throw error;

      setSelectedDependencies(data?.map(dep => dep.depends_on_service_id) || []);
    } catch (error) {
      toast.error('Failed to load dependencies');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.rpc('set_service_dependencies', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
        p_dependency_ids: selectedDependencies,
      });

      if (error) throw error;

      toast.success('Dependencies updated successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update dependencies');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromCycle = async () => {
    if (!copyFromCycleId) return;

    try {
      const { data, error } = await supabase
        .from('microservice_deps')
        .select('depends_on_service_id')
        .eq('cycle_id', copyFromCycleId)
        .eq('service_id', service.id);

      if (error) throw error;

      setSelectedDependencies(data?.map(dep => dep.depends_on_service_id) || []);
      toast.success('Dependencies copied from selected cycle');
    } catch (error) {
      toast.error('Failed to copy dependencies');
    }
  };

  const handleDependencyChange = (serviceId: string, checked: boolean) => {
    setSelectedDependencies(prev =>
      checked
        ? [...prev, serviceId]
        : prev.filter(id => id !== serviceId)
    );
  };

  const availableServices = allServices.filter(s => s.id !== service.id);
  const otherCycles = cycles.filter(c => c.id !== currentCycleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Dependencies - {service.name}</DialogTitle>
          <DialogDescription>
            Configure which services {service.name} depends on for the selected deployment cycle.
            Dependencies are specific to each cycle.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Cycle Selection */}
            <div className="space-y-2">
              <Label>Deployment Cycle</Label>
              <Select value={currentCycleId} onValueChange={setCurrentCycleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Copy from another cycle */}
            {otherCycles.length > 0 && (
              <div className="space-y-2">
                <Label>Copy from another cycle (optional)</Label>
                <div className="flex gap-2">
                  <Select value={copyFromCycleId} onValueChange={setCopyFromCycleId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select cycle to copy from" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherCycles.map(cycle => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyFromCycle}
                    disabled={!copyFromCycleId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Dependencies */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Dependencies for this cycle</Label>
              <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
                {availableServices.length === 0 ? (
                  <p className="text-sm text-slate-500">No other services available</p>
                ) : (
                  availableServices.map((availableService) => {
                    const isSelected = selectedDependencies.includes(availableService.id);
                    
                    return (
                      <div key={availableService.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={availableService.id}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleDependencyChange(availableService.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={availableService.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {availableService.name}
                          </Label>
                          {availableService.description && (
                            <p className="text-xs text-slate-500">
                              {availableService.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-md">
              <strong>Note:</strong> Dependencies are cycle-specific. This service will only 
              wait for the selected dependencies within the chosen deployment cycle.
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !currentCycleId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Dependencies
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}