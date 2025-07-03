'use client';

import { useState, useEffect } from 'react';
import { supabase, TenantService, CycleServiceWithState, DeploymentCycle, TaskItem } from '@/lib/supabase';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Copy, Plus, X, CheckSquare, Square } from 'lucide-react';

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
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCycleId, setCurrentCycleId] = useState(cycleId);
  const [copyFromCycleId, setCopyFromCycleId] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadCycles();
    }
  }, [open]);

  useEffect(() => {
    if (open && currentCycleId) {
      loadTasks();
    }
  }, [open, currentCycleId, service.id]);

  const loadCycles = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_cycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      toast.error('Failed to load cycles');
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.rpc('get_service_tasks', { 
        p_cycle_id: currentCycleId, 
        p_service_id: service.id 
      });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast.error('Failed to load tasks');
    }
  };

  const handleCopyFromCycle = async () => {
    if (!copyFromCycleId) return;

    try {
      const { data: tasksRes, error } = await supabase.rpc('get_service_tasks', { 
        p_cycle_id: copyFromCycleId, 
        p_service_id: service.id 
      });

      if (error) throw error;

      // Save copied tasks to database
      for (const task of tasksRes || []) {
        await supabase.rpc('add_task_to_service', {
          p_cycle_id: currentCycleId,
          p_service_id: service.id,
          p_task_text: task.text
        });
      }

      await loadTasks(); // Reload to get proper task IDs from database
      toast.success('Tasks copied from selected cycle');
    } catch (error) {
      toast.error('Failed to copy tasks');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    try {
      const { data: taskId, error } = await supabase.rpc('add_task_to_service', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
        p_task_text: newTaskText.trim()
      });

      if (error) throw error;

      setNewTaskText('');
      await loadTasks(); // Reload tasks
      toast.success('Task added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add task');
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      const { error } = await supabase.rpc('remove_task_from_service', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
        p_task_id: taskId
      });

      if (error) throw error;

      await loadTasks(); // Reload tasks
      toast.success('Task removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove task');
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase.rpc('update_task_completion', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
        p_task_id: taskId,
        p_completed: completed
      });

      if (error) throw error;

      await loadTasks(); // Reload tasks
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onSuccess();
  };

  const otherCycles = cycles.filter(c => c.id !== currentCycleId);
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Tasks - {service.name}</DialogTitle>
          <DialogDescription>
            Configure tasks for {service.name} in the selected deployment cycle.
            Tasks help track what needs to be done before marking a service as ready.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 pb-4">
            <div className="space-y-2 px-1">
              <Label>Deployment Cycle</Label>
              <Select value={currentCycleId} onValueChange={setCurrentCycleId}>
                <SelectTrigger className="w-full">
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

            {otherCycles.length > 0 && (
              <div className="space-y-2">
                <Label>Copy from another cycle (optional)</Label>
                <div className="flex gap-2 px-1">
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

            {/* Progress indicator */}
            {totalTasks > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Progress:</span>
                <span className="text-slate-600">
                  {completedTasks} of {totalTasks} tasks completed
                </span>
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tasks management */}
          <div className="space-y-4 flex-1 overflow-hidden">
            {/* Add new task */}
            <div className="flex gap-2 px-1 pt-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTask}
                disabled={!newTaskText.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tasks list */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Square className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm text-slate-500 mb-2">No tasks configured for this service in this cycle</p>
                  <p className="text-xs text-slate-400">Add tasks to track what needs to be done before deployment</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 border rounded-md bg-white hover:bg-slate-50 transition-colors">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id, !task.completed)}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {task.completed ? (
                        <CheckSquare className="h-5 w-5 text-green-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {task.text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTask(task.id)}
                      className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-md">
              <strong>Note:</strong> Tasks help track what needs to be done before a service can be marked as ready. 
              Complete all tasks before moving to the ready state.
            </div>
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
            <Button 
              type="button" 
              onClick={handleClose}
              disabled={loading || !currentCycleId}
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 