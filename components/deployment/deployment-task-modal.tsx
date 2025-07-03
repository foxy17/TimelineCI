'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskItem } from '@/lib/supabase';
import { MarkdownRenderer } from '@/components/services/cycle-task-modal/markdown-renderer';

interface DeploymentTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskItem | null;
  serviceName: string;
}

export function DeploymentTaskModal({
  open,
  onOpenChange,
  task,
  serviceName,
}: DeploymentTaskModalProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>
            Task from service: <span className="font-bold">{serviceName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <MarkdownRenderer content={task.text} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
