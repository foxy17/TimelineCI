/*
  # Update Dependencies to be Cycle-Specific

  1. Schema Changes
    - Add cycle_id to microservice_deps table
    - Update unique constraint to include cycle_id
    - Update foreign key relationships

  2. Function Updates
    - Update dependency validation functions
    - Add functions to manage cycle-specific dependencies

  3. Data Migration
    - Migrate existing dependencies to all active cycles
*/

-- Add cycle_id to microservice_deps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'microservice_deps' AND column_name = 'cycle_id'
  ) THEN
    ALTER TABLE microservice_deps ADD COLUMN cycle_id UUID REFERENCES deployment_cycles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop the old unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'microservice_deps_service_id_depends_on_service_id_key'
  ) THEN
    ALTER TABLE microservice_deps DROP CONSTRAINT microservice_deps_service_id_depends_on_service_id_key;
  END IF;
END $$;

-- Add new unique constraint that includes cycle_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'microservice_deps_cycle_service_dependency_unique'
  ) THEN
    ALTER TABLE microservice_deps ADD CONSTRAINT microservice_deps_cycle_service_dependency_unique 
    UNIQUE(cycle_id, service_id, depends_on_service_id);
  END IF;
END $$;

-- Migrate existing dependencies to all active cycles (if any exist)
DO $$
DECLARE
  cycle_record RECORD;
  dep_record RECORD;
BEGIN
  -- Only migrate if there are dependencies without cycle_id
  IF EXISTS (SELECT 1 FROM microservice_deps WHERE cycle_id IS NULL) THEN
    -- For each active deployment cycle
    FOR cycle_record IN SELECT id FROM deployment_cycles LOOP
      -- Copy all existing dependencies to this cycle
      FOR dep_record IN SELECT service_id, depends_on_service_id FROM microservice_deps WHERE cycle_id IS NULL LOOP
        INSERT INTO microservice_deps (cycle_id, service_id, depends_on_service_id)
        VALUES (cycle_record.id, dep_record.service_id, dep_record.depends_on_service_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
    
    -- Remove old dependencies without cycle_id
    DELETE FROM microservice_deps WHERE cycle_id IS NULL;
  END IF;
END $$;

-- Make cycle_id NOT NULL after migration
ALTER TABLE microservice_deps ALTER COLUMN cycle_id SET NOT NULL;

-- Update RLS policy for microservice_deps
DROP POLICY IF EXISTS "tenant_isolation_microservice_deps" ON microservice_deps;

CREATE POLICY "tenant_isolation_microservice_deps" ON microservice_deps
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c
    JOIN microservices s ON s.tenant_id = c.tenant_id
    WHERE c.id = cycle_id 
    AND s.id = service_id
    AND c.tenant_id = ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid
  )
);

-- Update the start_deployment function to check cycle-specific dependencies
CREATE OR REPLACE FUNCTION public.start_deployment(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  blockers INT;
BEGIN
  -- 1. Must currently be 'ready'
  UPDATE service_deployments
  SET state = 'ready'  -- dummy write to lock row
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id
    AND state = 'ready';

  IF NOT FOUND THEN
     RAISE EXCEPTION 'SERVICE_NOT_READY';
  END IF;

  -- 2. Count cycle-specific dependencies not yet deployed within same cycle
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

  -- 3. All clear → mark triggered
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

-- Update the get_unmet_dependencies function for cycle-specific dependencies
CREATE OR REPLACE FUNCTION public.get_unmet_dependencies(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS TABLE(service_name TEXT, service_id UUID) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.name,
    s.id
  FROM microservice_deps d
  JOIN microservices s ON s.id = d.depends_on_service_id
  JOIN service_deployments sd ON sd.service_id = d.depends_on_service_id
  WHERE d.cycle_id = p_cycle_id
    AND d.service_id = p_service_id
    AND sd.cycle_id = p_cycle_id
    AND sd.state <> 'deployed';
END;
$$;

-- Add function to copy dependencies from one cycle to another
CREATE OR REPLACE FUNCTION public.copy_dependencies_to_cycle(
  p_source_cycle_id UUID,
  p_target_cycle_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO microservice_deps (cycle_id, service_id, depends_on_service_id)
  SELECT 
    p_target_cycle_id,
    service_id,
    depends_on_service_id
  FROM microservice_deps
  WHERE cycle_id = p_source_cycle_id
  ON CONFLICT DO NOTHING;
END;
$$;

-- Add function to manage dependencies for a specific cycle and service
CREATE OR REPLACE FUNCTION public.set_service_dependencies(
  p_cycle_id UUID,
  p_service_id UUID,
  p_dependency_ids UUID[]
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  dep_id UUID;
BEGIN
  -- Delete existing dependencies for this service in this cycle
  DELETE FROM microservice_deps 
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;
  
  -- Insert new dependencies
  FOREACH dep_id IN ARRAY p_dependency_ids LOOP
    INSERT INTO microservice_deps (cycle_id, service_id, depends_on_service_id)
    VALUES (p_cycle_id, p_service_id, dep_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;