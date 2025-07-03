import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Package } from 'lucide-react';
import { TenantService } from '@/lib/supabase';

interface AvailableServicesProps {
  availableServices: TenantService[];
  onAddService: (serviceId: string) => void;
}

export function AvailableServices({ availableServices, onAddService }: AvailableServicesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Services
          <Badge variant="secondary">{availableServices.length}</Badge>
        </CardTitle>
        <CardDescription>
          Services that can be added to this cycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availableServices.length === 0 ? (
          <p className="text-slate-600 text-center py-4">
            All services are already in this cycle
          </p>
        ) : (
          <div className="space-y-3">
            {availableServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-medium">{service.name}</span>
                  {service.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddService(service.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 