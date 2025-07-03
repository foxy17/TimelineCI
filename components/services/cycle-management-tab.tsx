import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { DeploymentCycle, CycleServiceWithState, TenantService } from '@/lib/supabase';
import { CycleSelection } from './cycle-selection';
import { ServicesInCycle } from './services-in-cycle';
import { AvailableServices } from './available-services';

interface CycleManagementTabProps {
  cycles: DeploymentCycle[];
  selectedCycleId: string;
  selectedCycle: DeploymentCycle | undefined;
  cycleServices: CycleServiceWithState[];
  availableServices: TenantService[];
  onCycleChange: (cycleId: string) => void;
  onAddService: (serviceId: string) => void;
  onManageTasks: (service: CycleServiceWithState) => void;
  onManageDependencies: (service: CycleServiceWithState) => void;
  onRemoveService: (serviceId: string) => void;
}

export function CycleManagementTab({
  cycles,
  selectedCycleId,
  selectedCycle,
  cycleServices,
  availableServices,
  onCycleChange,
  onAddService,
  onManageTasks,
  onManageDependencies,
  onRemoveService,
}: CycleManagementTabProps) {
  if (cycles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No deployment cycles</h3>
          <p className="text-slate-600 text-center mb-4">
            Create a deployment cycle to start managing service deployments
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CycleSelection
        cycles={cycles}
        selectedCycleId={selectedCycleId}
        selectedCycle={selectedCycle}
        onCycleChange={onCycleChange}
      />

      {selectedCycleId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServicesInCycle
            cycleServices={cycleServices}
            onManageTasks={onManageTasks}
            onManageDependencies={onManageDependencies}
            onRemoveService={onRemoveService}
          />

          <AvailableServices availableServices={availableServices} onAddService={onAddService} />
        </div>
      )}
    </div>
  );
}
