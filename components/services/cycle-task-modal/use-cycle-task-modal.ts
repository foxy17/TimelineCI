import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TenantService, CycleServiceWithState, DeploymentCycle, TaskItem } from '@/lib/supabase';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

interface UseCycleTaskModalProps {
  open: boolean;
  service: TenantService | CycleServiceWithState;
  cycleId: string;
}

export function useCycleTaskModal({ open, service, cycleId }: UseCycleTaskModalProps) {
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCycleId, setCurrentCycleId] = useState(cycleId);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [showNote, setShowNote] = useState(true);

  useEffect(() => {
    if (open) {
      loadCycles();
      // Load note visibility preference from localStorage
      const noteHidden = localStorage.getItem(LOCAL_STORAGE_KEYS.TASK_MODAL_NOTE_HIDDEN);
      setShowNote(noteHidden !== 'true');
    }
  }, [open]);

  useEffect(() => {
    if (open && currentCycleId) {
      loadTasks();
    }
  }, [open, currentCycleId, service.id]);

  const loadCycles = async () => {
    try {
      const { data, error } = await createClient()
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
      const { data, error } = await createClient().rpc('get_service_tasks', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
      });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast.error('Failed to load tasks');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    try {
      const { data: taskId, error } = await createClient().rpc('add_task_to_service', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
        p_task_text: newTaskText.trim(),
      });

      if (error) throw error;

      setNewTaskText('');
      await loadTasks();
      toast.success('Task added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add task');
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      const { error } = await createClient().rpc('remove_task_from_service', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
        p_task_id: taskId,
      });

      if (error) throw error;

      await loadTasks();
      toast.success('Task removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove task');
    }
  };

  const handleEditTask = (taskId: string, currentText: string) => {
    setEditingTaskId(taskId);
    setEditTaskText(currentText);
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId || !editTaskText.trim()) return;

    try {
      const { error } = await createClient().rpc('update_task_text', {
        p_cycle_id: currentCycleId,
        p_service_id: service.id,
        p_task_id: editingTaskId,
        p_task_text: editTaskText.trim(),
      });

      if (error) throw error;

      setEditingTaskId(null);
      setEditTaskText('');
      await loadTasks();
      toast.success('Task updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTaskText('');
  };

  const handleHideNote = () => {
    setShowNote(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.TASK_MODAL_NOTE_HIDDEN, 'true');
  };

  return {
    // State
    cycles,
    tasks,
    newTaskText,
    loading,
    currentCycleId,
    editingTaskId,
    editTaskText,
    showNote,

    // Setters
    setNewTaskText,
    setCurrentCycleId,
    setEditTaskText,

    // Actions
    handleAddTask,
    handleRemoveTask,
    handleEditTask,
    handleSaveEdit,
    handleCancelEdit,
    handleHideNote,
  };
}
