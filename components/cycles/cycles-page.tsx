'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateCycleModal } from '@/components/cycles/create-cycle-modal';
import { EditCycleModal } from '@/components/cycles/edit-cycle-modal';
import { LatestCycleDisplay } from '@/components/cycles/latest-cycle-display';
import { CyclesList } from '@/components/cycles/cycles-list';
import { useCycles } from '@/components/cycles/hooks/use-cycles';
import { DeploymentCycle } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, CheckCircle } from 'lucide-react';

export function CyclesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<DeploymentCycle | null>(null);
  const [completingCycle, setCompletingCycle] = useState<string | null>(null);

  const {
    cycles,
    loading,
    activeCycle,
    latestCycle,
    loadCycles,
    handleActivateCycle,
    handleCompleteCycle: handleCompleteCycleAction,
  } = useCycles();

  const handleCycleCreated = () => {
    loadCycles();
    setCreateModalOpen(false);
  };

  const handleEditCycle = (cycle: DeploymentCycle) => {
    setSelectedCycle(cycle);
    setEditModalOpen(true);
  };

  const handleCycleEdited = () => {
    loadCycles();
    setEditModalOpen(false);
    setSelectedCycle(null);
  };

  const handleCompleteCycle = async () => {
    if (!completingCycle) return;

    await handleCompleteCycleAction();
    setCompletingCycle(null);
  };

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
                    Are you sure you want to complete the active cycle &ldquo;{activeCycle.label}
                    &rdquo;? This will mark it as inactive and you&apos;ll need to create a new
                    cycle or activate an existing one to continue deployments.
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

      <LatestCycleDisplay cycle={latestCycle} />

      <CyclesList
        cycles={cycles}
        loading={loading}
        onActivateCycle={handleActivateCycle}
        onCreateCycle={() => setCreateModalOpen(true)}
        onEditCycle={handleEditCycle}
      />

      <CreateCycleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCycleCreated}
      />

      <EditCycleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        cycle={selectedCycle}
        onSuccess={handleCycleEdited}
      />
    </div>
  );
}
