/*
  # Fix Function Parameter Names

  Multiple functions in the database have incorrect parameter names that don't match
  what the frontend is calling. This migration ensures all functions have the correct
  parameter names and signatures as expected by the frontend.

  Issue: Frontend calls functions with (p_cycle_id, p_service_id) parameters
  but database functions expect (p_cycle, p_service) based on error messages.
*/

-- Fix set_service_dependencies function
DROP FUNCTION IF EXISTS public.set_service_dependencies(UUID, UUID, UUID[]);
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

-- Fix set_service_ready function
DROP FUNCTION IF EXISTS public.set_service_ready(UUID, UUID);
CREATE OR REPLACE FUNCTION public.set_service_ready(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE service_deployments
  SET 
    state = 'ready',
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id
    AND state = 'not_ready';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_READY_FOR_TRANSITION';
  END IF;
END;
$$;

-- Fix start_deployment function
DROP FUNCTION IF EXISTS public.start_deployment(UUID, UUID);
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

-- Fix mark_deployed function
DROP FUNCTION IF EXISTS public.mark_deployed(UUID, UUID);
CREATE OR REPLACE FUNCTION public.mark_deployed(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE service_deployments
  SET 
    state = 'deployed',
    finished_at = NOW(),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id
    AND state = 'triggered';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_TRIGGERED';
  END IF;
END;
$$;

-- Fix mark_failed function
DROP FUNCTION IF EXISTS public.mark_failed(UUID, UUID);
CREATE OR REPLACE FUNCTION public.mark_failed(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE service_deployments
  SET 
    state = 'failed',
    finished_at = NOW(),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id
    AND state IN ('triggered', 'ready');
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_DEPLOYABLE';
  END IF;
END;
$$;

-- Fix get_unmet_dependencies function
DROP FUNCTION IF EXISTS public.get_unmet_dependencies(UUID, UUID);
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