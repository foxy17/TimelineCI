'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface DependencyErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  unmetDependencies: Array<{
    service_name: string;
    service_id: string;
  }>;
}

export function DependencyErrorModal({
  open,
  onOpenChange,
  serviceName,
  unmetDependencies,
}: DependencyErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Dependencies Not Met
          </DialogTitle>
          <DialogDescription>
            Cannot start deployment for <strong>{serviceName}</strong> because the following
            dependencies are not yet deployed:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            {unmetDependencies.map(dep => (
              <div
                key={dep.service_id}
                className="flex items-center gap-2 p-2 bg-amber-50 rounded-md border border-amber-200"
              >
                <ArrowRight className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">{dep.service_name}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-600 mt-4">
            Please ensure all dependencies are deployed before starting this deployment.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
