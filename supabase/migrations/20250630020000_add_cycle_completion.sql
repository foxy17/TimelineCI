/*
  # Add Cycle Completion Management

  1. Schema Changes
    - Add completed_at timestamp to track when cycles are completed
    - Add completed_by to track who completed the cycle

  2. Function Updates
    - Add function to explicitly complete/deactivate the active cycle
    - Update activate_cycle to clear completion info when reactivating

  3. Enhanced Functionality
    - Allow explicit cycle completion without creating new cycles
    - Track completion metadata for reporting
*/

-- Add completion tracking columns to deployment_cycles
ALTER TABLE deployment_cycles ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE deployment_cycles ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);

-- Function to complete/deactivate the current active cycle
CREATE OR REPLACE FUNCTION public.complete_active_cycle()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_cycle_id UUID;
BEGIN
  -- Get or ensure tenant ID
  v_tenant_id := get_current_tenant_id();
  
  -- Find the active cycle for this tenant
  SELECT id INTO v_cycle_id
  FROM deployment_cycles
  WHERE tenant_id = v_tenant_id
    AND is_active = true;
  
  IF v_cycle_id IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_CYCLE';
  END IF;
  
  -- Complete the cycle
  UPDATE deployment_cycles
  SET 
    is_active = false,
    completed_at = NOW(),
    completed_by = auth.uid()
  WHERE id = v_cycle_id;
  
  RETURN v_cycle_id;
END;
$$;

-- Function to reactivate a completed cycle (clears completion info)
CREATE OR REPLACE FUNCTION public.reactivate_cycle(
  p_cycle_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id for the cycle
  SELECT tenant_id INTO v_tenant_id
  FROM deployment_cycles
  WHERE id = p_cycle_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'CYCLE_NOT_FOUND';
  END IF;
  
  -- Deactivate all other cycles for this tenant
  PERFORM deactivate_other_cycles(v_tenant_id, p_cycle_id);
  
  -- Reactivate the specified cycle and clear completion info
  UPDATE deployment_cycles
  SET 
    is_active = true,
    completed_at = NULL,
    completed_by = NULL
  WHERE id = p_cycle_id;
END;
$$;

-- Update the existing activate_cycle function to use reactivate_cycle logic
CREATE OR REPLACE FUNCTION public.activate_cycle(
  p_cycle_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM reactivate_cycle(p_cycle_id);
END;
$$;

-- Function to get cycle completion statistics
CREATE OR REPLACE FUNCTION public.get_cycle_completion_stats()
RETURNS TABLE(
  total_cycles BIGINT,
  active_cycles BIGINT,
  completed_cycles BIGINT,
  avg_completion_time_days NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get or ensure tenant ID
  v_tenant_id := get_current_tenant_id();
  
  RETURN QUERY
  SELECT 
    COUNT(*) as total_cycles,
    COUNT(*) FILTER (WHERE is_active = true) as active_cycles,
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_cycles,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_completion_time_days
  FROM deployment_cycles
  WHERE tenant_id = v_tenant_id;
END;
$$; 