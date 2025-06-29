/*
  # Add Cycle State Management

  1. Schema Changes
    - Add is_active column to deployment_cycles table
    - Add constraint to ensure only one active cycle per tenant

  2. Function Updates
    - Update create_deployment_cycle to deactivate old cycles when creating new ones
    - Add functions to activate/deactivate cycles
    - Add function to get active cycle for tenant

  3. Data Migration
    - Set most recent cycle as active for each tenant
*/

-- Add is_active column to deployment_cycles
ALTER TABLE deployment_cycles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create unique partial index to ensure only one active cycle per tenant
CREATE UNIQUE INDEX IF NOT EXISTS deployment_cycles_tenant_active_unique 
ON deployment_cycles (tenant_id) 
WHERE is_active = true;

-- Function to deactivate all cycles for a tenant except the specified one
CREATE OR REPLACE FUNCTION public.deactivate_other_cycles(
  p_tenant_id UUID,
  p_active_cycle_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE deployment_cycles
  SET is_active = false
  WHERE tenant_id = p_tenant_id
    AND id != p_active_cycle_id
    AND is_active = true;
END;
$$;

-- Function to activate a specific cycle (and deactivate others)
CREATE OR REPLACE FUNCTION public.activate_cycle(
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
  
  -- Activate the specified cycle
  UPDATE deployment_cycles
  SET is_active = true
  WHERE id = p_cycle_id;
END;
$$;

-- Function to get the active cycle for current tenant
CREATE OR REPLACE FUNCTION public.get_active_cycle()
RETURNS TABLE(
  id UUID,
  tenant_id UUID,
  label TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  is_active BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get or ensure tenant ID
  v_tenant_id := get_current_tenant_id();
  
  RETURN QUERY
  SELECT 
    c.id,
    c.tenant_id,
    c.label,
    c.created_by,
    c.created_at,
    c.is_active
  FROM deployment_cycles c
  WHERE c.tenant_id = v_tenant_id
    AND c.is_active = true;
END;
$$;

-- Update create_deployment_cycle to manage active state
CREATE OR REPLACE FUNCTION public.create_deployment_cycle(
  p_label TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_cycle_id UUID;
  v_most_recent_cycle_id UUID;
  service_record RECORD;
BEGIN
  -- Get or ensure tenant ID
  v_tenant_id := get_current_tenant_id();
  
  -- Create the cycle (will be active by default)
  INSERT INTO deployment_cycles (tenant_id, label, created_by, is_active)
  VALUES (v_tenant_id, p_label, auth.uid(), true)
  RETURNING id INTO v_cycle_id;
  
  -- Deactivate all other cycles for this tenant
  PERFORM deactivate_other_cycles(v_tenant_id, v_cycle_id);
  
  -- Find the most recent cycle for this tenant (excluding the one we just created)
  SELECT id INTO v_most_recent_cycle_id
  FROM deployment_cycles
  WHERE tenant_id = v_tenant_id 
    AND id != v_cycle_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If we found a recent cycle, copy its services to the new cycle
  IF v_most_recent_cycle_id IS NOT NULL THEN
    -- Copy all services from the most recent cycle
    FOR service_record IN 
      SELECT service_id FROM cycle_services WHERE cycle_id = v_most_recent_cycle_id
    LOOP
      PERFORM add_service_to_cycle(v_cycle_id, service_record.service_id);
    END LOOP;
    
    -- Also copy dependencies from the most recent cycle
    PERFORM copy_dependencies_to_cycle(v_most_recent_cycle_id, v_cycle_id);
  END IF;
  
  RETURN v_cycle_id;
END;
$$;

-- Migrate existing data: set the most recent cycle as active for each tenant
DO $$
DECLARE
  tenant_record RECORD;
  most_recent_cycle_id UUID;
BEGIN
  -- For each tenant, find their most recent cycle and make it active
  FOR tenant_record IN SELECT DISTINCT tenant_id FROM deployment_cycles LOOP
    -- Get the most recent cycle for this tenant
    SELECT id INTO most_recent_cycle_id
    FROM deployment_cycles
    WHERE tenant_id = tenant_record.tenant_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Set all cycles as inactive first
    UPDATE deployment_cycles
    SET is_active = false
    WHERE tenant_id = tenant_record.tenant_id;
    
    -- Set the most recent cycle as active
    IF most_recent_cycle_id IS NOT NULL THEN
      UPDATE deployment_cycles
      SET is_active = true
      WHERE id = most_recent_cycle_id;
    END IF;
  END LOOP;
END $$; 