import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit2 } from 'lucide-react';
import { TenantService } from '@/lib/supabase';

interface ServicePoolTabProps {
  tenantServices: TenantService[];
  onCreateService: () => void;
  onEditService: (service: TenantService) => void;
}

export function ServicePoolTab({
  tenantServices,
  onCreateService,
  onEditService,
}: ServicePoolTabProps) {
  if (tenantServices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No services in pool</h3>
          <p className="text-slate-600 text-center mb-4">
            Create your first service to start building your deployment pool
          </p>
          <Button onClick={onCreateService}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Service
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tenantServices.map(service => (
        <Card key={service.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <Badge variant="outline">
                {service.in_cycles} cycle{service.in_cycles !== 1 ? 's' : ''}
              </Badge>
            </div>
            {service.description && <CardDescription>{service.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Created {new Date(service.created_at).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditService(service)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit service</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
