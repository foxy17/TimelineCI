'use client';

import { useState, useEffect } from 'react';
import { supabase, DeploymentCycle } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateCycleModal } from '@/components/cycles/create-cycle-modal';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

export function CyclesPage() {
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
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

  if (loading) {
    return <div className="text-center py-8">Loading cycles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deployment Cycles</h1>
          <p className="text-slate-600 mt-1">
            Manage deployment coordination and dependency tracking
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Cycle
        </Button>
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
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Cycle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => (
            <Card key={cycle.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cycle.label}</CardTitle>
                  <Badge variant={cycle.is_active ? "default" : "outline"}>
                    {cycle.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>
                  Created {formatDistanceToNow(new Date(cycle.created_at))} ago
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
                        onClick={() => handleActivateCycle(cycle.id)}
                      >
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
          ))}
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