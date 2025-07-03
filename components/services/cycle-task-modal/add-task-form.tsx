import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useAutoResize } from './use-auto-resize';

interface AddTaskFormProps {
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  onAddTask: () => void;
}

export function AddTaskForm({ newTaskText, setNewTaskText, onAddTask }: AddTaskFormProps) {
  const textareaRef = useAutoResize(newTaskText);

  return (
    <div className="space-y-2 px-1 pt-2">
      <Label>Add New Task</Label>
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Add a new task... (supports markdown: **bold**, *italic*, `code`, ~~strikethrough~~, lists, etc.)"
          value={newTaskText}
          onChange={e => setNewTaskText(e.target.value)}
          className="flex-1 min-h-[40px] resize-none overflow-hidden"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onAddTask();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAddTask}
          disabled={!newTaskText.trim()}
          className="self-start"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        Tip: Use Ctrl/Cmd + Enter to quickly add tasks. Supports full markdown syntax.
      </p>
    </div>
  );
}
