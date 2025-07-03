import { useState } from 'react';
import { TenantService, CycleServiceWithState } from '@/lib/supabase';

export function useServiceModals() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<
    TenantService | CycleServiceWithState | null
  >(null);

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);

  const openDependencyModal = (service: TenantService | CycleServiceWithState) => {
    setSelectedService(service);
    setDependencyModalOpen(true);
  };

  const closeDependencyModal = () => {
    setDependencyModalOpen(false);
    setSelectedService(null);
  };

  const openTaskModal = (service: TenantService | CycleServiceWithState) => {
    setSelectedService(service);
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedService(null);
  };

  return {
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
  };
}
