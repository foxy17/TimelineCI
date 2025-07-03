import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trash2 } from 'lucide-react';
import { CycleServiceWithState, TenantService } from '@/lib/supabase';

interface ServicesInCycleProps {
  cycleServices: CycleServiceWithState[];
  onManageTasks: (service: CycleServiceWithState) => void;
  onManageDependencies: (service: CycleServiceWithState) => void;
  onRemoveService: (serviceId: string) => void;
}

export function ServicesInCycle({
  cycleServices,
  onManageTasks,
  onManageDependencies,
  onRemoveService
}: ServicesInCycleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Services in Cycle
          <Badge variant="secondary">{cycleServices.length}</Badge>
        </CardTitle>
        <CardDescription>
          Services participating in this deployment cycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cycleServices.length === 0 ? (
          <p className="text-slate-600 text-center py-4">
            No services in this cycle yet
          </p>
        ) : (
          <div className="space-y-3">
            {cycleServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    <Badge 
                      variant={
                        service.deployment_state === 'deployed' ? 'default' :
                        service.deployment_state === 'triggered' ? 'secondary' :
                        'outline'
                      }
                    >
                      {service.deployment_state.replace('_', ' ')}
                    </Badge>
                  </div>
                  {service.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageTasks(service)}
                    title="Manage Tasks"
                  >
                    Tasks
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageDependencies(service)}
                    title="Manage Dependencies"
                  >
                    Dependencies
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveService(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 