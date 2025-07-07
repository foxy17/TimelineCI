'use client';

import { DeploymentCycle } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Calendar, ArrowRight, CheckCircle, Play, MoreVertical, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import clsx from 'clsx';

interface CyclesListProps {
  cycles: DeploymentCycle[];
  loading: boolean;
  onActivateCycle: (cycleId: string) => void;
  onCreateCycle: () => void;
  onEditCycle: (cycle: DeploymentCycle) => void;
}

export function CyclesList({
  cycles,
  loading,
  onActivateCycle,
  onCreateCycle,
  onEditCycle,
}: CyclesListProps) {
  const getCycleStatus = (cycle: DeploymentCycle) => {
    if (cycle.is_active) {
      return { label: 'In Progress', variant: 'default' as const, icon: null };
    } else if (cycle.completed_at) {
      return { label: 'Completed', variant: 'outline' as const, icon: CheckCircle };
    } else {
      return { label: 'Inactive', variant: 'secondary' as const, icon: null };
    }
  };

  const formatCompletionInfo = (cycle: DeploymentCycle) => {
    if (!cycle.completed_at) return null;
    return `Completed ${formatDistanceToNow(new Date(cycle.completed_at))} ago`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading cycles...</div>;
  }

  if (cycles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No deployment cycles yet</h3>
          <p className="text-slate-600 text-center mb-4">
            Create your first deployment cycle to start coordinating releases
          </p>
          <Button
            onClick={onCreateCycle}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Cycle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">All Cycles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cycles.map(cycle => {
          const status = getCycleStatus(cycle);
          const completionInfo = formatCompletionInfo(cycle);
          const StatusIcon = status.icon;

          return (
            <Card key={cycle.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cycle.label}</CardTitle>
                  <Badge
                    variant={status.variant}
                    className={clsx(
                      cycle.is_active && 'bg-green-600 text-white hover:bg-green-700'
                    )}
                  >
                    {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                    {status.label}
                  </Badge>
                </div>
                <CardDescription>
                  Created {formatDistanceToNow(new Date(cycle.created_at))} ago
                  {completionInfo && (
                    <>
                      <br />
                      {completionInfo}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    {new Date(cycle.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {!cycle.is_active && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          onClick={() => onActivateCycle(cycle.id)}
                        >
                          <Play className="mr-2 h-3 w-3" />
                          Activate
                        </Button>
                      )}

                      {!cycle.completed_at && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-2">
                              <MoreVertical className="mr-2 h-3 w-3" />
                              Edit
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditCycle(cycle)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit Cycle Name
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Link href={`/dashboard/cycles/${cycle.id}`}>
                        <Button
                          size="sm"
                          className="bg-black hover:bg-gray-800 text-white font-semibold"
                        >
                          View Board
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
