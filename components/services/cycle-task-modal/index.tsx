'use client';

import { TenantService, CycleServiceWithState } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCycleTaskModal } from './use-cycle-task-modal';
import { CycleSelector } from './cycle-selector';
import { AddTaskForm } from './add-task-form';
import { TaskList } from './task-list';
import { Note } from './note';

interface CycleTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: TenantService | CycleServiceWithState;
  cycleId: string;
  onSuccess: () => void;
}

export function CycleTaskModal({
  open,
  onOpenChange,
  service,
  cycleId,
  onSuccess,
}: CycleTaskModalProps) {
  const {
    cycles,
    tasks,
    newTaskText,
    loading,
    currentCycleId,
    editingTaskId,
    editTaskText,
    showNote,
    setNewTaskText,
    setCurrentCycleId,
    setEditTaskText,
    handleAddTask,
    handleRemoveTask,
    handleEditTask,
    handleSaveEdit,
    handleCancelEdit,
    handleHideNote,
  } = useCycleTaskModal({ open, service, cycleId });

  const handleClose = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Tasks - {service.name}</DialogTitle>
          <DialogDescription>
            Configure tasks for {service.name} in the selected deployment cycle. Tasks help track
            what needs to be done before marking a service as ready.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 pb-4">
            <CycleSelector
              cycles={cycles}
              currentCycleId={currentCycleId}
              onCycleChange={setCurrentCycleId}
            />
          </div>

          <div className="space-y-4 flex-1 overflow-hidden">
            <AddTaskForm
              newTaskText={newTaskText}
              setNewTaskText={setNewTaskText}
              onAddTask={handleAddTask}
            />

            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto max-h-[300px]">
                <TaskList
                  tasks={tasks}
                  editingTaskId={editingTaskId}
                  editTaskText={editTaskText}
                  setEditTaskText={setEditTaskText}
                  onEditTask={handleEditTask}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onRemoveTask={handleRemoveTask}
                />
              </div>
            </div>

            {showNote && <Note onHide={handleHideNote} />}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleClose} disabled={loading || !currentCycleId}>
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
