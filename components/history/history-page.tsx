'use client';

import { useState, useEffect } from 'react';
import { supabase, DeploymentView, DeploymentCycle } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, GitBranch, Search, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

export function HistoryPage() {
  const [deployments, setDeployments] = useState<DeploymentView[]>([]);
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deploymentsRes, cyclesRes] = await Promise.all([
        supabase
          .from('v_deployments')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase
          .from('deployment_cycles')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (deploymentsRes.error) throw deploymentsRes.error;
      if (cyclesRes.error) throw cyclesRes.error;

      setDeployments(deploymentsRes.data || []);
      setCycles(cyclesRes.data || []);
    } catch (error) {
      toast.error('Failed to load deployment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.service_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      deployment.cycle_label
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesCycle = selectedCycle === 'all' || deployment.cycle_id === selectedCycle;
    const matchesState = selectedState === 'all' || deployment.state === selectedState;

    return matchesSearch && matchesCycle && matchesState;
  });

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case 'deployed':
        return 'default';

      case 'triggered':
        return 'secondary';
      case 'ready':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'not_ready':
        return 'Not Ready';
      case 'ready':
        return 'Ready';
      case 'triggered':
        return 'In Progress';
      case 'deployed':
        return 'Deployed';

      default:
        return state;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading deployment history...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Deployment History</h1>
        <p className="text-slate-600 mt-1">
          Complete timeline of all deployment activities
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search services or cycles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All cycles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cycles</SelectItem>
                {cycles.map(cycle => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="not_ready">Not Ready</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="triggered">In Progress</SelectItem>
                <SelectItem value="deployed">Deployed</SelectItem>

              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredDeployments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No deployment history found
              </h3>
              <p className="text-slate-600 text-center">
                {searchTerm || selectedCycle !== 'all' || selectedState !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start creating deployment cycles to see history here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDeployments.map((deployment) => (
            <Card key={deployment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-slate-500" />
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {deployment.service_name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {deployment.cycle_label}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStateBadgeVariant(deployment.state)}>
                    {getStateLabel(deployment.state)}
                  </Badge>
                </div>

                {deployment.service_description && (
                  <p className="text-sm text-slate-600 mb-4">
                    {deployment.service_description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Updated {formatDistanceToNow(new Date(deployment.updated_at))} ago
                    </span>
                  </div>
                  
                  {deployment.started_at && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Started {format(new Date(deployment.started_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  )}

                  {deployment.updated_by_email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="h-4 w-4" />
                      <span>
                        By {deployment.updated_by_email.split('@')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {deployment.finished_at && (
                  <div className="mt-2 text-sm text-slate-600">
                    Finished {format(new Date(deployment.finished_at), 'MMM d, HH:mm')}
                    {deployment.started_at && (
                      <span className="ml-2">
                        (Duration: {formatDistanceToNow(
                          new Date(deployment.started_at),
                          { includeSeconds: true }
                        )})
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}