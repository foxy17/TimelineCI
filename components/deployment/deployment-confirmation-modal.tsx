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
import { AlertTriangle, ArrowRight, RefreshCw, RotateCcw, Square } from 'lucide-react';

interface DeploymentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  action: 'start' | 'reset_triggered' | 'reset_ready' | 'reset_not_ready';
  serviceName: string;
}

export function DeploymentConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  action,
  serviceName,
}: DeploymentConfirmationModalProps) {
  const getActionConfig = () => {
    switch (action) {
      case 'start':
        return {
          title: 'Start Deployment',
          description: `Are you sure you want to start the deployment for ${serviceName}?`,
          icon: <ArrowRight className="h-5 w-5 text-blue-500" />,
          confirmText: 'Start Deploy',
          confirmVariant: 'default' as const,
          warning: 'This will begin the deployment process.',
        };
      case 'reset_triggered':
        return {
          title: 'Restart Deployment',
          description: `Are you sure you want to restart the deployment for ${serviceName}?`,
          icon: <RefreshCw className="h-5 w-5 text-orange-500" />,
          confirmText: 'Restart',
          confirmVariant: 'destructive' as const,
          warning: 'This will reset the deployment back to triggered state.',
        };
      case 'reset_ready':
        return {
          title: 'Reset to Ready',
          description: `Are you sure you want to reset ${serviceName} back to ready state?`,
          icon: <RotateCcw className="h-5 w-5 text-amber-500" />,
          confirmText: 'Reset to Ready',
          confirmVariant: 'destructive' as const,
          warning: 'This will undo the current deployment progress.',
        };
      case 'reset_not_ready':
        return {
          title: 'Reset to Not Ready',
          description: `Are you sure you want to reset ${serviceName} back to not ready state?`,
          icon: <Square className="h-5 w-5 text-red-500" />,
          confirmText: 'Reset to Not Ready',
          confirmVariant: 'destructive' as const,
          warning: 'This will completely reset the deployment state.',
        };
      default:
        return {
          title: 'Confirm Action',
          description: `Are you sure you want to proceed with this action for ${serviceName}?`,
          icon: <AlertTriangle className="h-5 w-5 text-gray-500" />,
          confirmText: 'Confirm',
          confirmVariant: 'default' as const,
          warning: 'This action cannot be undone.',
        };
    }
  };

  const config = getActionConfig();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-md border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800">{config.warning}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={config.confirmVariant} onClick={handleConfirm}>
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 