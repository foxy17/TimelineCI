/*
  # Improve Service Management System

  1. Fix user_metadata column issue by using auth.users.email directly
  2. Separate global service pool from cycle-specific service deployments
  3. Add ability to add/remove services from specific cycles
  4. Add functions to manage service pool and cycle participation
  5. Auto-copy services from most recent cycle when creating new cycles
  6. Ensure compatibility with is_active state management

  Changes:
  - Create cycle_services table for explicit service-cycle relationships
  - Update functions to work with the new service pool concept
  - Add functions to manage which services participate in which cycles
  - Fix any auth.users access issues
  - Auto-populate new cycles with services from the most recent cycle
  - Maintain compatibility with cycle state management
*/

-- Create table to track which services participate in which cycles
CREATE TABLE IF NOT EXISTS cycle_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES deployment_cycles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES microservices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, service_id)
);

-- Enable RLS on the new table
ALTER TABLE cycle_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for cycle_services
CREATE POLICY "tenant_access_cycle_services" ON cycle_services
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c
    JOIN tenant_members tm ON tm.tenant_id = c.tenant_id
    WHERE c.id = cycle_services.cycle_id
    AND tm.user_id = auth.uid()
  )
);

-- Function to add a service to a specific cycle
CREATE OR REPLACE FUNCTION public.add_service_to_cycle(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert into cycle_services (tracks which services are in which cycles)
  INSERT INTO cycle_services (cycle_id, service_id)
  VALUES (p_cycle_id, p_service_id)
  ON CONFLICT (cycle_id, service_id) DO NOTHING;
  
  -- Insert into service_deployments (tracks deployment state)
  INSERT INTO service_deployments (cycle_id, service_id)
  VALUES (p_cycle_id, p_service_id)
  ON CONFLICT (cycle_id, service_id) DO NOTHING;
END;
$$;

-- Function to remove a service from a specific cycle
CREATE OR REPLACE FUNCTION public.remove_service_from_cycle(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Remove from cycle_services
  DELETE FROM cycle_services 
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;
  
  -- Remove from service_deployments
  DELETE FROM service_deployments 
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;
  
  -- Remove any dependencies for this service in this cycle
  DELETE FROM microservice_deps 
  WHERE cycle_id = p_cycle_id 
  AND (service_id = p_service_id OR depends_on_service_id = p_service_id);
END;
$$;

-- Function to get services available for a tenant (global service pool)
CREATE OR REPLACE FUNCTION public.get_tenant_services()
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  in_cycles BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get or ensure tenant ID
  v_tenant_id := get_current_tenant_id();
  
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.created_at,
    COUNT(cs.cycle_id) as in_cycles
  FROM microservices s
  LEFT JOIN cycle_services cs ON cs.service_id = s.id
  WHERE s.tenant_id = v_tenant_id
  GROUP BY s.id, s.name, s.description, s.created_at
  ORDER BY s.name;
END;
$$;

-- Function to get services in a specific cycle
CREATE OR REPLACE FUNCTION public.get_cycle_services(p_cycle_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  deployment_state TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.created_at,
    COALESCE(sd.state::TEXT, 'not_ready') as deployment_state
  FROM microservices s
  JOIN cycle_services cs ON cs.service_id = s.id
  LEFT JOIN service_deployments sd ON sd.service_id = s.id AND sd.cycle_id = p_cycle_id
  WHERE cs.cycle_id = p_cycle_id
  ORDER BY s.name;
END;
$$;

-- Function to get services NOT in a specific cycle (available to add)
CREATE OR REPLACE FUNCTION public.get_available_services_for_cycle(p_cycle_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant ID from the cycle
  SELECT c.tenant_id INTO v_tenant_id
  FROM deployment_cycles c
  WHERE c.id = p_cycle_id;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.created_at
  FROM microservices s
  WHERE s.tenant_id = v_tenant_id
  AND s.id NOT IN (
    SELECT cs.service_id 
    FROM cycle_services cs 
    WHERE cs.cycle_id = p_cycle_id
  )
  ORDER BY s.name;
END;
$$;

-- Update create_microservice to NOT automatically add to all cycles (uses new service pool approach)
CREATE OR REPLACE FUNCTION public.create_microservice(
  p_name TEXT,
  p_description TEXT DEFAULT ''
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_service_id UUID;
BEGIN
  -- Get or ensure tenant ID (from violet_summit migration)
  v_tenant_id := get_current_tenant_id();
  
  -- Create the microservice (but don't auto-add to cycles)
  INSERT INTO microservices (tenant_id, name, description)
  VALUES (v_tenant_id, p_name, p_description)
  RETURNING id INTO v_service_id;
  
  RETURN v_service_id;
END;
$$;

-- Function to copy services from one cycle to another
CREATE OR REPLACE FUNCTION public.copy_services_to_cycle(
  p_source_cycle_id UUID,
  p_target_cycle_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  service_record RECORD;
BEGIN
  -- Copy all services from source cycle to target cycle
  FOR service_record IN 
    SELECT service_id FROM cycle_services WHERE cycle_id = p_source_cycle_id
  LOOP
    PERFORM add_service_to_cycle(p_target_cycle_id, service_record.service_id);
  END LOOP;
  
  -- Copy dependencies as well (from violet_summit migration)
  PERFORM copy_dependencies_to_cycle(p_source_cycle_id, p_target_cycle_id);
END;
$$;

-- Drop and recreate start_deployment function to avoid parameter conflicts
DROP FUNCTION IF EXISTS public.start_deployment(UUID, UUID);

-- Update the start_deployment function to work with cycle_services
CREATE OR REPLACE FUNCTION public.start_deployment(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  blockers INT;
BEGIN
  -- 1. Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- 2. Must currently be 'ready'
  UPDATE service_deployments
  SET state = 'ready'  -- dummy write to lock row
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id
    AND state = 'ready';

  IF NOT FOUND THEN
     RAISE EXCEPTION 'SERVICE_NOT_READY';
  END IF;

  -- 3. Count cycle-specific dependencies not yet deployed within same cycle
  SELECT COUNT(*) INTO blockers
  FROM microservice_deps d
  JOIN service_deployments sd
    ON sd.service_id = d.depends_on_service_id
   AND sd.cycle_id = p_cycle_id
  WHERE d.cycle_id = p_cycle_id
    AND d.service_id = p_service_id
    AND sd.state <> 'deployed';

  IF blockers > 0 THEN
     RAISE EXCEPTION 'DEPENDENCIES_NOT_DEPLOYED';
  END IF;

  -- 4. All clear → mark triggered
  UPDATE service_deployments
  SET 
    state = 'triggered',
    started_at = NOW(),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id;
END;
$$;

-- Migrate existing data to the new structure
DO $$
DECLARE
  deployment_record RECORD;
BEGIN
  -- For each existing service_deployment, create a corresponding cycle_services entry
  FOR deployment_record IN 
    SELECT DISTINCT cycle_id, service_id FROM service_deployments
  LOOP
    INSERT INTO cycle_services (cycle_id, service_id)
    VALUES (deployment_record.cycle_id, deployment_record.service_id)
    ON CONFLICT (cycle_id, service_id) DO NOTHING;
  END LOOP;
END $$;

-- Update the view to include cycle participation info
DROP VIEW IF EXISTS v_deployments;
CREATE VIEW v_deployments AS
SELECT 
  d.cycle_id,
  d.service_id,
  d.state,
  d.started_at,
  d.updated_at,
  s.name AS service_name,
  s.description AS service_description,
  c.label AS cycle_label,
  c.created_at AS cycle_created_at,
  u.email AS updated_by_email,
  cs.created_at AS added_to_cycle_at
FROM service_deployments d
JOIN microservices s ON s.id = d.service_id
JOIN deployment_cycles c ON c.id = d.cycle_id
JOIN cycle_services cs ON cs.cycle_id = d.cycle_id AND cs.service_id = d.service_id
LEFT JOIN auth.users u ON u.id = d.updated_by;

-- Note: The create_deployment_cycle function is intentionally NOT redefined here
-- to avoid conflicts with the cycle state management migration (20250629090000)
-- which properly handles the is_active column and state management.
-- This migration focuses on the service pool functionality, and the
-- create_deployment_cycle function will be properly updated in the later migration. 