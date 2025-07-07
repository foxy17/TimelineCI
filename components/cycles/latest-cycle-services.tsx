'use client';

import { DeploymentView } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface LatestCycleServicesProps {
  services: DeploymentView[];
  getServiceDependencies: (serviceId: string) => Array<{
    serviceName: string;
    isDeployed: boolean;
  }>;
  getTaskCompletionCount: (service: DeploymentView) => {
    completed: number;
    total: number;
  };
}

export function LatestCycleServices({
  services,
  getServiceDependencies,
  getTaskCompletionCount,
}: LatestCycleServicesProps) {
  const getServiceStatus = (service: DeploymentView) => {
    switch (service.state) {
      case 'deployed':
        return {
          color: 'bg-white border-slate-400',
          textColor: 'text-slate-900',
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        };
      case 'triggered':
        return {
          color: 'bg-white border-slate-400',
          textColor: 'text-slate-900',
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
        };
      case 'ready':
        return {
          color: 'bg-white border-slate-400',
          textColor: 'text-slate-900',
          icon: <Play className="h-4 w-4 text-blue-600" />,
        };
      default:
        return {
          color: 'bg-white border-slate-400',
          textColor: 'text-slate-900',
          icon: <AlertTriangle className="h-4 w-4 text-slate-600" />,
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {services.map(service => {
        const serviceStatus = getServiceStatus(service);
        const dependencies = getServiceDependencies(service.service_id);
        const taskCount = getTaskCompletionCount(service);

        return (
          <Card key={service.service_id} className={clsx(serviceStatus.color, 'border')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle
                    className={clsx('text-sm font-medium truncate', serviceStatus.textColor)}
                  >
                    {service.service_name}
                  </CardTitle>
                  {service.state !== 'not_ready' && (
                    <Badge
                      variant="secondary"
                      className={clsx(
                        'text-xs px-2 py-0.5',
                        service.state === 'deployed' &&
                          'bg-green-100 text-green-800 border-green-300',
                        service.state === 'triggered' &&
                          'bg-yellow-100 text-yellow-800 border-yellow-300',
                        service.state === 'ready' && 'bg-blue-100 text-blue-800 border-blue-300'
                      )}
                    >
                      {service.state === 'deployed'
                        ? 'Deployed'
                        : service.state === 'triggered'
                          ? 'In Progress'
                          : service.state === 'ready'
                            ? 'Ready'
                            : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Dependencies */}
              {dependencies.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-700">Dependencies:</p>
                  {dependencies.map((dep, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">{dep.serviceName}</span>
                      {dep.isDeployed ? (
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Task Progress */}
              {taskCount.total > 0 && (
                <div className="text-xs text-slate-600">
                  <span className="font-medium">Tasks:</span> {taskCount.completed} out of{' '}
                  {taskCount.total} completed
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
