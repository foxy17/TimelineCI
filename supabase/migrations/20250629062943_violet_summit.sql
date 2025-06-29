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

-- Function to create new microservice with proper tenant isolation
CREATE OR REPLACE FUNCTION public.create_microservice(
  p_name TEXT,
  p_description TEXT DEFAULT ''
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_service_id UUID;
  v_cycle RECORD;
BEGIN
  -- Get tenant ID from JWT
  v_tenant_id := ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_ID_REQUIRED';
  END IF;
  
  -- Create the microservice
  INSERT INTO microservices (tenant_id, name, description)
  VALUES (v_tenant_id, p_name, p_description)
  RETURNING id INTO v_service_id;
  
  -- Add service to all existing deployment cycles for this tenant
  FOR v_cycle IN 
    SELECT id FROM deployment_cycles WHERE tenant_id = v_tenant_id
  LOOP
    INSERT INTO service_deployments (cycle_id, service_id)
    VALUES (v_cycle.id, v_service_id);
  END LOOP;
  
  RETURN v_service_id;
END;
$$;

-- Function to ensure tenant setup and membership
CREATE OR REPLACE FUNCTION public.ensure_tenant_setup()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_email_domain TEXT;
  v_tenant_id UUID;
  v_existing_member_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_AUTHENTICATED';
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = v_user_id;
  
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'USER_EMAIL_NOT_FOUND';
  END IF;
  
  -- Extract email domain
  v_email_domain := split_part(v_user_email, '@', 2);
  
  -- Find or create tenant based on email domain
  SELECT id INTO v_tenant_id 
  FROM tenants 
  WHERE email_domain = v_email_domain;
  
  IF v_tenant_id IS NULL THEN
    -- Create new tenant
    INSERT INTO tenants (name, email_domain)
    VALUES (initcap(replace(v_email_domain, '.', ' ')), v_email_domain)
    RETURNING id INTO v_tenant_id;
  END IF;
  
  -- Check if user is already a member
  SELECT id INTO v_existing_member_id
  FROM tenant_members
  WHERE tenant_id = v_tenant_id AND user_id = v_user_id;
  
  -- Add user as tenant member if not already a member
  IF v_existing_member_id IS NULL THEN
    INSERT INTO tenant_members (tenant_id, user_id, role)
    VALUES (v_tenant_id, v_user_id, 'ADMIN'); -- First user becomes admin
  END IF;
  
  RETURN v_tenant_id;
END;
$$;

-- Function to get current user's tenant ID
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try to get tenant_id from JWT claims first
  v_tenant_id := ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid;
  
  -- If not in JWT, ensure tenant setup and return tenant_id
  IF v_tenant_id IS NULL THEN
    v_tenant_id := ensure_tenant_setup();
  END IF;
  
  RETURN v_tenant_id;
END;
$$;

-- Update create_microservice to use the new tenant resolution
CREATE OR REPLACE FUNCTION public.create_microservice(
  p_name TEXT,
  p_description TEXT DEFAULT ''
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_service_id UUID;
  v_cycle RECORD;
BEGIN
  -- Get or ensure tenant ID
  v_tenant_id := get_current_tenant_id();
  
  -- Create the microservice
  INSERT INTO microservices (tenant_id, name, description)
  VALUES (v_tenant_id, p_name, p_description)
  RETURNING id INTO v_service_id;
  
  -- Add service to all existing deployment cycles for this tenant
  FOR v_cycle IN 
    SELECT id FROM deployment_cycles WHERE tenant_id = v_tenant_id
  LOOP
    INSERT INTO service_deployments (cycle_id, service_id)
    VALUES (v_cycle.id, v_service_id);
  END LOOP;
  
  RETURN v_service_id;
END;
$$;

-- Update create_deployment_cycle to use the new tenant resolution
CREATE OR REPLACE FUNCTION public.create_deployment_cycle(
  p_label TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_cycle_id UUID;
  v_service RECORD;
BEGIN
  -- Get or ensure tenant ID
  v_tenant_id := get_current_tenant_id();
  
  -- Create the cycle
  INSERT INTO deployment_cycles (tenant_id, label, created_by)
  VALUES (v_tenant_id, p_label, auth.uid())
  RETURNING id INTO v_cycle_id;
  
  -- Create service deployment records for all services
  FOR v_service IN 
    SELECT id FROM microservices WHERE tenant_id = v_tenant_id
  LOOP
    INSERT INTO service_deployments (cycle_id, service_id)
    VALUES (v_cycle_id, v_service.id);
  END LOOP;
  
  RETURN v_cycle_id;
END;
$$;