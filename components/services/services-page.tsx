'use client';

import { useState, useEffect } from 'react';
import { supabase, Microservice, MicroserviceDep, DeploymentCycle } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateServiceModal } from '@/components/services/create-service-modal';
import { CycleDependencyModal } from '@/components/services/cycle-dependency-modal';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, GitBranch, Link as LinkIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function ServicesPage() {
  const [services, setServices] = useState<Microservice[]>([]);
  const [dependencies, setDependencies] = useState<MicroserviceDep[]>([]);
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Microservice | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      loadDependencies();
    }
  }, [selectedCycleId]);

  const loadData = async () => {
    try {
      const [servicesRes, cyclesRes] = await Promise.all([
        supabase.from('microservices').select('*').order('name'),
        supabase.from('deployment_cycles').select('*').order('created_at', { ascending: false }),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (cyclesRes.error) throw cyclesRes.error;

      setServices(servicesRes.data || []);
      setCycles(cyclesRes.data || []);
      
      // Auto-select the most recent cycle
      if (cyclesRes.data && cyclesRes.data.length > 0 && !selectedCycleId) {
        setSelectedCycleId(cyclesRes.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    if (!selectedCycleId) return;

    try {
      const { data, error } = await supabase
        .from('microservice_deps')
        .select('*')
        .eq('cycle_id', selectedCycleId);

      if (error) throw error;
      setDependencies(data || []);
    } catch (error) {
      toast.error('Failed to load dependencies');
    }
  };

  const handleServiceCreated = () => {
    loadData();
    setCreateModalOpen(false);
  };

  const handleDependenciesUpdated = () => {
    loadDependencies();
    setDependencyModalOpen(false);
    setSelectedService(null);
  };

  const getServiceDependencies = (serviceId: string) => {
    return dependencies
      .filter(dep => dep.service_id === serviceId)
      .map(dep => {
        const depService = services.find(s => s.id === dep.depends_on_service_id);
        return depService?.name || 'Unknown';
      });
  };

  const getDependentServices = (serviceId: string) => {
    return dependencies
      .filter(dep => dep.depends_on_service_id === serviceId)
      .map(dep => {
        const depService = services.find(s => s.id === dep.service_id);
        return depService?.name || 'Unknown';
      });
  };

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-600 mt-1">
            Manage microservices and their cycle-specific dependencies
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Cycle Selection */}
      {cycles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              View Dependencies for Cycle
            </CardTitle>
            <CardDescription>
              Dependencies are specific to each deployment cycle. Select a cycle to view and manage dependencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a deployment cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCycle && (
                <Badge variant="outline">
                  Created {new Date(selectedCycle.created_at).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No services configured
            </h3>
            <p className="text-slate-600 text-center mb-4">
              Add your first microservice to start coordinating deployments
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const serviceDeps = getServiceDependencies(service.id);
            const dependentServices = getDependentServices(service.id);

            return (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedService(service);
                        setDependencyModalOpen(true);
                      }}
                      disabled={!selectedCycleId}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  {service.description && (
                    <CardDescription>{service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCycleId ? (
                    <>
                      {/* Dependencies */}
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                          <LinkIcon className="h-4 w-4" />
                          Depends on ({serviceDeps.length})
                        </div>
                        {serviceDeps.length === 0 ? (
                          <p className="text-sm text-slate-500">No dependencies in this cycle</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {serviceDeps.map((dep, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dependent services */}
                      {dependentServices.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <GitBranch className="h-4 w-4" />
                            Required by ({dependentServices.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {dependentServices.map((dep, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-slate-500 text-center py-4">
                      Select a deployment cycle to view dependencies
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateServiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleServiceCreated}
      />

      {selectedService && (
        <CycleDependencyModal
          open={dependencyModalOpen}
          onOpenChange={setDependencyModalOpen}
          service={selectedService}
          allServices={services}
          cycles={cycles}
          selectedCycleId={selectedCycleId}
          onSuccess={handleDependenciesUpdated}
        />
      )}
    </div>
  );
}