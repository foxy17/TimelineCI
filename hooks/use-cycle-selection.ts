import { useState, useEffect } from 'react';
import { DeploymentCycle } from '@/lib/supabase';

export function useCycleSelection(cycles: DeploymentCycle[]) {
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  // Auto-select the most recent cycle when cycles are loaded
  useEffect(() => {
    if (cycles.length > 0 && !selectedCycleId) {
      setSelectedCycleId(cycles[0].id);
    }
  }, [cycles, selectedCycleId]);

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);

  return {
    selectedCycleId,
    setSelectedCycleId,
    selectedCycle,
  };
}
