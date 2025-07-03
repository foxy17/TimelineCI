'use client';

import { DeploymentView, TaskItem } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  ArrowRight,
  AlertTriangle,
  Link as LinkIcon,
  RefreshCw,
  RotateCcw,
  Square,
  Eye
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { DeploymentTaskRenderer, getTaskLineCount } from '@/components/deployment/deployment-task-renderer';
import { DeploymentTaskModal } from '@/components/deployment/deployment-task-modal';

interface DeploymentCardProps {
  deployment: DeploymentView;
  dependencies: Array<{
    serviceName: string;
    isDeployed: boolean;
  }>;
  onStateChange: (action: 'ready' | 'start' | 'deployed' | 'reset_not_ready' | 'reset_ready' | 'reset_triggered') => void;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
}

export function DeploymentCard({ deployment, dependencies, onStateChange, onTaskToggle }: DeploymentCardProps) {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleViewTask = (task: TaskItem) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'not_ready':
        return <Clock className="h-4 w-4 text-slate-500" />;
      case 'ready':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'triggered':
        return <ArrowRight className="h-4 w-4 text-yellow-600" />;
      case 'deployed':
        return null; // No icon for deployed state

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
        actions.push(
          {
            label: 'Start Deploy',
            action: 'start' as const,
            variant: 'default' as const,
          },
          {
            label: 'Reset to Not Ready',
            action: 'reset_not_ready' as const,
            variant: 'outline' as const,
          }
        );
        break;
      case 'triggered':
        actions.push(
          {
            label: 'Mark Deployed',
            action: 'deployed' as const,
            variant: 'default' as const,
          },

          {
            label: 'Reset to Ready',
            action: 'reset_ready' as const,
            variant: 'outline' as const,
          },
          {
            label: 'Reset to Not Ready',
            action: 'reset_not_ready' as const,
            variant: 'outline' as const,
          }
        );
        break;
      case 'deployed':
        actions.push(
          {
            label: 'Restart Deployment',
            action: 'reset_triggered' as const,
            variant: 'default' as const,
          },
          {
            label: 'Reset to Ready',
            action: 'reset_ready' as const,
            variant: 'outline' as const,
          },
          {
            label: 'Reset to Not Ready',
            action: 'reset_not_ready' as const,
            variant: 'outline' as const,
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
            {deployment.service_name} d sadasd asd  das as d d sadasd asd  das as d d sadasd asd  das as dd sadasd asd  das as d
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
              {dependencies.map((dep) => (
                <div key={dep.serviceName} className="flex items-center justify-between text-xs">
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

        {/* Tasks Section */}
        {deployment.tasks && deployment.tasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              Tasks ({deployment.tasks.filter(t => t.completed).length}/{deployment.tasks.length})
            </div>
            <div className="space-y-2">
              {deployment.tasks.map((task) => {
                const isLongTask = getTaskLineCount(task.text) > 5;
                
                return (
                  <div key={task.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 pt-0.5">
                        {deployment.state === 'not_ready' && onTaskToggle ? (
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => onTaskToggle(task.id, checked as boolean)}
                            className="h-4 w-4"
                          />
                        ) : (
                          task.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mt-0.5" />
                          )
                        )}
                      </div>
                      
                      <div className={clsx('flex-1 min-w-0 overflow-hidden', task.completed ? 'opacity-60' : '')}>
                        <div className={clsx(task.completed ? 'line-through' : '')}>
                          <DeploymentTaskRenderer content={task.text} maxLines={5} />
                        </div>
                        
                        {isLongTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 mt-1"
                            onClick={() => handleViewTask(task)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View more
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
          {getAvailableActions().map((action, index) => {
            // Actions that require dependency validation
            const requiresDependencyCheck = ['start', 'reset_triggered'].includes(action.action);
            const isDisabled = requiresDependencyCheck && hasUnmetDependencies;
            
            // Primary actions that should be CTAs
            const isPrimaryAction = index === 0 && !isDisabled;
            
            // Get icon for each action
            const getActionIcon = () => {
              switch (action.action) {
                case 'ready':
                  return <Play className="mr-2 h-4 w-4" />;
                case 'start':
                  return <ArrowRight className="mr-2 h-4 w-4" />;
                case 'deployed':
                  return <CheckCircle className="mr-2 h-4 w-4" />;

                case 'reset_triggered':
                  return <RefreshCw className="mr-2 h-4 w-4" />;
                case 'reset_ready':
                  return <RotateCcw className="mr-2 h-4 w-4" />;
                case 'reset_not_ready':
                  return <Square className="mr-2 h-4 w-4" />;
                default:
                  return null;
              }
            };
            
            return (
              <Button
                key={action.action}
                variant={action.variant}
                size={isPrimaryAction ? "default" : "sm"}
                className={`w-full ${
                  isPrimaryAction 
                    ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200" 
                    : ""
                }`}
                onClick={() => onStateChange(action.action)}
                disabled={isDisabled}
              >
                {getActionIcon()}
                {action.label}
              </Button>
            );
          })}
          
          {hasUnmetDependencies && (deployment.state === 'ready' || deployment.state === 'deployed') && (
            <div className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Waiting for dependencies to retry/restart
            </div>
          )}
        </div>
      </CardContent>

      <DeploymentTaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        task={selectedTask}
        serviceName={deployment.service_name}
      />
    </Card>
  );
}