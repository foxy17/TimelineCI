'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DeploymentCycle } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateCycleModal } from '@/components/cycles/create-cycle-modal';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Calendar, ArrowRight, CheckCircle, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

export function CyclesPage() {
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completingCycle, setCompletingCycle] = useState<string | null>(null);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('deployment_cycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      toast.error('Failed to load deployment cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleCycleCreated = () => {
    loadCycles();
    setCreateModalOpen(false);
  };

  const handleActivateCycle = async (cycleId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('activate_cycle', {
        p_cycle_id: cycleId,
      });

      if (error) throw error;

      toast.success('Cycle activated successfully!');
      loadCycles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate cycle');
    }
  };

  const handleCompleteCycle = async () => {
    if (!completingCycle) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('complete_active_cycle');

      if (error) throw error;

      toast.success('Cycle completed successfully!');
      loadCycles();
    } catch (error: any) {
      if (error.message === 'NO_ACTIVE_CYCLE') {
        toast.error('No active cycle to complete');
      } else {
        toast.error(error.message || 'Failed to complete cycle');
      }
    } finally {
      setCompletingCycle(null);
    }
  };

  const getCycleStatus = (cycle: DeploymentCycle) => {
    if (cycle.is_active) {
      return { label: 'Active', variant: 'default' as const, icon: null }; // No icon for active state
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

  const activeCycle = cycles.find(c => c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deployment Cycles</h1>
          <p className="text-slate-600 mt-1">
            Manage deployment coordination and dependency tracking
          </p>
        </div>
        <div className="flex gap-2">
          {activeCycle && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" onClick={() => setCompletingCycle(activeCycle.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Active Cycle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete Deployment Cycle</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to complete the active cycle "{activeCycle.label}"? 
                    This will mark it as inactive and you'll need to create a new cycle or activate 
                    an existing one to continue deployments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setCompletingCycle(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleCompleteCycle}>
                    Complete Cycle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Cycle
          </Button>
        </div>
      </div>

      {cycles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No deployment cycles yet
            </h3>
            <p className="text-slate-600 text-center mb-4">
              Create your first deployment cycle to start coordinating releases
            </p>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Cycle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => {
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
                      className={cycle.is_active ? 'bg-green-600 text-white hover:bg-green-700' : ''}
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
                    <div className="flex gap-2">
                      {!cycle.is_active && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          onClick={() => handleActivateCycle(cycle.id)}
                        >
                          <Play className="mr-2 h-3 w-3" />
                          Activate
                        </Button>
                      )}
                      <Link href={`/dashboard/cycles/${cycle.id}`}>
                        <Button variant="outline" size="sm">
                          View Board
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCycleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCycleCreated}
      />
    </div>
  );
}