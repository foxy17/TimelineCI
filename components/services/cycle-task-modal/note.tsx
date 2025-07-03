import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface NoteProps {
  onHide: () => void;
}

export function Note({ onHide }: NoteProps) {
  return (
    <div className="text-sm text-slate-600 bg-blue-50 p-3 pr-10 rounded-md relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onHide}
        className="absolute top-2 right-2 h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-blue-100"
      >
        <X className="h-4 w-4" />
      </Button>
      <strong>Note:</strong> Tasks help track what needs to be done before a service can be marked
      as ready. You can use full markdown formatting including lists, code blocks, headers, and
      more.
    </div>
  );
}
