import { Square } from 'lucide-react';
import { TaskItem } from '@/lib/supabase';
import { TaskItemComponent } from './task-item';

interface TaskListProps {
  tasks: TaskItem[];
  editingTaskId: string | null;
  editTaskText: string;
  setEditTaskText: (text: string) => void;
  onEditTask: (taskId: string, text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemoveTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  editingTaskId,
  editTaskText,
  setEditTaskText,
  onEditTask,
  onSaveEdit,
  onCancelEdit,
  onRemoveTask,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Square className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-sm text-slate-500 mb-2">No tasks configured for this service in this cycle</p>
        <p className="text-xs text-slate-400">Add tasks to track what needs to be done before deployment</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pr-2">
      {tasks.map((task) => (
        <TaskItemComponent
          key={task.id}
          task={task}
          isEditing={editingTaskId === task.id}
          editText={editTaskText}
          setEditText={setEditTaskText}
          onEdit={onEditTask}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          onRemove={onRemoveTask}
        />
      ))}
    </div>
  );
} 