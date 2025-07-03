import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, X, Check } from 'lucide-react';
import { TaskItem } from '@/lib/supabase';
import { MarkdownRenderer } from './markdown-renderer';
import { useAutoResize } from './use-auto-resize';

interface TaskItemProps {
  task: TaskItem;
  isEditing: boolean;
  editText: string;
  setEditText: (text: string) => void;
  onEdit: (taskId: string, text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: (taskId: string) => void;
}

export function TaskItemComponent({
  task,
  isEditing,
  editText,
  setEditText,
  onEdit,
  onSave,
  onCancel,
  onRemove,
}: TaskItemProps) {
  const editTextareaRef = useAutoResize(editText);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 border rounded-md bg-white">
        <div className="space-y-2">
          <Textarea
            ref={editTextareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[40px] resize-none overflow-hidden"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSave();
              }
              if (e.key === 'Escape') {
                onCancel();
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={!editText.trim()}
            >
              <Check className="h-4 w-4" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Tip: Use Ctrl/Cmd + Enter to save, Escape to cancel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-md bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm text-slate-900 leading-relaxed">
          <MarkdownRenderer content={task.text} />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task.id, task.text)}
            className="text-slate-600 hover:text-slate-700 hover:bg-slate-100"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(task.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 