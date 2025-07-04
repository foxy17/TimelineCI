'use client';

import { Button } from '@/components/ui/button';
import { CreateServiceModal } from '@/components/services/create-service-modal';
import { CycleDependencyModal } from '@/components/services/cycle-dependency-modal';
import { CycleTaskModal } from '@/components/services/cycle-task-modal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Package } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Custom hooks
import { useServicesData } from '@/hooks/use-services-data';
import { useCycleSelection } from '@/hooks/use-cycle-selection';
import { useCycleServices } from '@/hooks/use-cycle-services';
import { useServiceOperations } from '@/hooks/use-service-operations';
import { useServiceModals } from '@/hooks/use-service-modals';

// Tab components
import { ServicePoolTab } from '@/components/services/service-pool-tab';
import { CycleManagementTab } from '@/components/services/cycle-management-tab';

export function ServicesPage() {
  // Data loading and management
  const { tenantServices, cycles, loading, refetch: refetchServices } = useServicesData();
  const { selectedCycleId, setSelectedCycleId, selectedCycle } = useCycleSelection(cycles);
  const {
    cycleServices,
    availableServices,
    refetch: refetchCycleServices,
  } = useCycleServices(selectedCycleId);

  // Operations
  const { serviceToRemove, setServiceToRemove, addServiceToCycle, confirmRemoveService } =
    useServiceOperations();

  // Modal management
  const {
    createModalOpen,
    dependencyModalOpen,
    taskModalOpen,
    selectedService,
    openCreateModal,
    closeCreateModal,
    openDependencyModal,
    closeDependencyModal,
    openTaskModal,
    closeTaskModal,
  } = useServiceModals();

  // Event handlers
  const handleServiceCreated = () => {
    refetchServices();
    refetchCycleServices();
    closeCreateModal();
  };

  const handleDependenciesUpdated = () => {
    refetchCycleServices();
    closeDependencyModal();
  };

  const handleTasksUpdated = () => {
    refetchCycleServices();
    closeTaskModal();
  };

  const handleAddServiceToCycle = async (serviceId: string) => {
    const success = await addServiceToCycle(selectedCycleId, serviceId);
    if (success) {
      refetchServices();
      refetchCycleServices();
    }
  };

  const handleRemoveServiceFromCycle = async () => {
    const success = await confirmRemoveService(selectedCycleId);
    if (success) {
      refetchServices();
      refetchCycleServices();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-600 mt-1">Manage your service pool and deployment cycles</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <Tabs defaultValue="pool" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pool" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Service Pool
            <Badge variant="secondary">{tenantServices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cycle Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pool" className="space-y-6">
          <ServicePoolTab tenantServices={tenantServices} onCreateService={openCreateModal} />
        </TabsContent>

        <TabsContent value="cycles" className="space-y-6">
          <CycleManagementTab
            cycles={cycles}
            selectedCycleId={selectedCycleId}
            selectedCycle={selectedCycle}
            cycleServices={cycleServices}
            availableServices={availableServices}
            onCycleChange={setSelectedCycleId}
            onAddService={handleAddServiceToCycle}
            onManageTasks={openTaskModal}
            onManageDependencies={openDependencyModal}
            onRemoveService={setServiceToRemove}
          />
        </TabsContent>
      </Tabs>

      <CreateServiceModal
        open={createModalOpen}
        onOpenChange={closeCreateModal}
        onSuccess={handleServiceCreated}
      />

      {selectedService && (
        <CycleDependencyModal
          open={dependencyModalOpen}
          onOpenChange={closeDependencyModal}
          service={selectedService}
          cycleId={selectedCycleId}
          onSuccess={handleDependenciesUpdated}
        />
      )}

      {selectedService && (
        <CycleTaskModal
          open={taskModalOpen}
          onOpenChange={closeTaskModal}
          service={selectedService}
          cycleId={selectedCycleId}
          onSuccess={handleTasksUpdated}
        />
      )}

      <AlertDialog open={!!serviceToRemove} onOpenChange={() => setServiceToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Service from Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this service from the deployment cycle? This will also
              remove any dependencies involving this service in this cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveServiceFromCycle}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
