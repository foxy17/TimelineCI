'use client';

import { DeploymentView } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  ArrowRight,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';

interface DeploymentCardProps {
  deployment: DeploymentView;
  dependencies: Array<{
    serviceName: string;
    isDeployed: boolean;
  }>;
  onStateChange: (action: 'ready' | 'start' | 'deployed' | 'failed') => void;
}

export function DeploymentCard({ deployment, dependencies, onStateChange }: DeploymentCardProps) {
  const getStateIcon = (state: string) => {
    switch (state) {
      case 'not_ready':
        return <Clock className="h-4 w-4 text-slate-500" />;
      case 'ready':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'triggered':
        return <ArrowRight className="h-4 w-4 text-yellow-600" />;
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (deployment.state) {
      case 'not_ready':
        actions.push({
          label: 'Mark Ready',
          action: 'ready' as const,
          variant: 'default' as const,
        });
        break;
      case 'ready':
        actions.push({
          label: 'Start Deploy',
          action: 'start' as const,
          variant: 'default' as const,
        });
        break;
      case 'triggered':
        actions.push(
          {
            label: 'Mark Deployed',
            action: 'deployed' as const,
            variant: 'default' as const,
          },
          {
            label: 'Mark Failed',
            action: 'failed' as const,
            variant: 'destructive' as const,
          }
        );
        break;
    }

    return actions;
  };

  const unmetDependencies = dependencies.filter(dep => !dep.isDeployed);
  const hasUnmetDependencies = unmetDependencies.length > 0;

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {deployment.service_name}
          </CardTitle>
          {getStateIcon(deployment.state)}
        </div>
        {deployment.service_description && (
          <p className="text-sm text-slate-600">{deployment.service_description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Dependencies Section */}
        {dependencies.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <LinkIcon className="h-3 w-3" />
              Dependencies
            </div>
            <div className="space-y-1">
              {dependencies.map((dep, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{dep.serviceName}</span>
                  {dep.isDeployed ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Timing Information */}
        <div className="space-y-1 text-xs text-slate-500">
          {deployment.started_at && (
            <div>
              Started: {formatDistanceToNow(new Date(deployment.started_at))} ago
            </div>
          )}
          {deployment.finished_at && (
            <div>
              Finished: {formatDistanceToNow(new Date(deployment.finished_at))} ago
            </div>
          )}
          {deployment.updated_by_email && (
            <div>
              By: {deployment.updated_by_email.split('@')[0]}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {getAvailableActions().map((action) => (
            <Button
              key={action.action}
              variant={action.variant}
              size="sm"
              className="w-full"
              onClick={() => onStateChange(action.action)}
              disabled={action.action === 'start' && hasUnmetDependencies}
            >
              {action.label}
            </Button>
          ))}
          
          {hasUnmetDependencies && deployment.state === 'ready' && (
            <div className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Waiting for dependencies
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}