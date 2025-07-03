import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeploymentCycle } from '@/lib/supabase';

interface CycleSelectorProps {
  cycles: DeploymentCycle[];
  currentCycleId: string;
  onCycleChange: (cycleId: string) => void;
}

export function CycleSelector({ cycles, currentCycleId, onCycleChange }: CycleSelectorProps) {
  return (
    <div className="space-y-2 px-1">
      <Label>Deployment Cycle</Label>
      <Select value={currentCycleId} onValueChange={onCycleChange}>
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
  );
}
