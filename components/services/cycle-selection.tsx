import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { DeploymentCycle } from '@/lib/supabase';

interface CycleSelectionProps {
  cycles: DeploymentCycle[];
  selectedCycleId: string;
  selectedCycle: DeploymentCycle | undefined;
  onCycleChange: (cycleId: string) => void;
}

export function CycleSelection({ 
  cycles, 
  selectedCycleId, 
  selectedCycle, 
  onCycleChange 
}: CycleSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Select Deployment Cycle
        </CardTitle>
        <CardDescription>
          Choose which services participate in each deployment cycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Select value={selectedCycleId} onValueChange={onCycleChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a deployment cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map(cycle => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.label} {cycle.is_active ? '(Active)' : '(Inactive)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCycle && (
            <div className="flex gap-2">
              <Badge variant={selectedCycle.is_active ? "default" : "outline"}>
                {selectedCycle.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">
                Created {new Date(selectedCycle.created_at).toLocaleDateString()}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 