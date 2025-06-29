/*  
  # Add Flexible State Management

  This migration adds functions to allow more flexible state transitions:
  - Reset service to 'not_ready' from any state
  - Set service to 'ready' from any state (with dependency validation)
  - Reset service to 'triggered' (in progress) from failed/deployed states
  - Comprehensive state transition function that validates transitions

  This allows operators to:
  - Retry failed deployments
  - Reset deployed services for redeployment
  - Move services backward in the deployment pipeline when needed

  The existing functions remain unchanged for backward compatibility.
*/

-- Function to reset a service to 'not_ready' state from any current state
CREATE OR REPLACE FUNCTION public.reset_service_to_not_ready(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Reset to not_ready from any state
  UPDATE service_deployments
  SET 
    state = 'not_ready',
    started_at = NULL,
    finished_at = NULL,
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND_IN_CYCLE';
  END IF;
END;
$$;

-- Function to set service to 'ready' from any state (improved version)
CREATE OR REPLACE FUNCTION public.set_service_ready_flexible(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Set to ready from any state
  UPDATE service_deployments
  SET 
    state = 'ready',
    started_at = NULL,
    finished_at = NULL,
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND_IN_CYCLE';
  END IF;
END;
$$;

-- Function to reset service to 'triggered' (in progress) from failed/deployed states
CREATE OR REPLACE FUNCTION public.reset_service_to_triggered(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  blockers INT;
  current_state deploy_state;
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Get current state
  SELECT state INTO current_state
  FROM service_deployments
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  -- Only allow reset to triggered from failed, deployed, or ready states
  IF current_state NOT IN ('failed', 'deployed', 'ready') THEN
    RAISE EXCEPTION 'INVALID_STATE_TRANSITION_TO_TRIGGERED';
  END IF;

  -- Check dependencies (same logic as start_deployment)
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

  -- Set to triggered
  UPDATE service_deployments
  SET 
    state = 'triggered',
    started_at = NOW(),
    finished_at = NULL,
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id
    AND service_id = p_service_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND_IN_CYCLE';
  END IF;
END;
$$;

-- Comprehensive function to transition service to any valid state
CREATE OR REPLACE FUNCTION public.transition_service_state(
  p_cycle_id UUID,
  p_service_id UUID,
  p_target_state TEXT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_state deploy_state;
  blockers INT;
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Validate target state
  IF p_target_state NOT IN ('not_ready', 'ready', 'triggered', 'deployed', 'failed') THEN
    RAISE EXCEPTION 'INVALID_TARGET_STATE';
  END IF;

  -- Get current state
  SELECT state INTO current_state
  FROM service_deployments
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  -- Handle specific transitions based on target state
  CASE p_target_state
    WHEN 'not_ready' THEN
      -- Allow reset to not_ready from any state
      UPDATE service_deployments
      SET 
        state = 'not_ready'::deploy_state,
        started_at = NULL,
        finished_at = NULL,
        updated_by = auth.uid(),
        updated_at = NOW()
      WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

    WHEN 'ready' THEN
      -- Allow transition to ready from any state
      UPDATE service_deployments
      SET 
        state = 'ready'::deploy_state,
        started_at = NULL,
        finished_at = NULL,
        updated_by = auth.uid(),
        updated_at = NOW()
      WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

    WHEN 'triggered' THEN
      -- Check dependencies before allowing transition to triggered
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

      UPDATE service_deployments
      SET 
        state = 'triggered'::deploy_state,
        started_at = NOW(),
        finished_at = NULL,
        updated_by = auth.uid(),
        updated_at = NOW()
      WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

    WHEN 'deployed' THEN
      -- Only allow transition to deployed from triggered state
      IF current_state != 'triggered' THEN
        RAISE EXCEPTION 'CAN_ONLY_DEPLOY_FROM_TRIGGERED_STATE';
      END IF;

      UPDATE service_deployments
      SET 
        state = 'deployed'::deploy_state,
        finished_at = NOW(),
        updated_by = auth.uid(),
        updated_at = NOW()
      WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

    WHEN 'failed' THEN
      -- Allow transition to failed from triggered or ready states
      IF current_state NOT IN ('triggered', 'ready') THEN
        RAISE EXCEPTION 'CAN_ONLY_FAIL_FROM_TRIGGERED_OR_READY_STATE';
      END IF;

      UPDATE service_deployments
      SET 
        state = 'failed'::deploy_state,
        finished_at = NOW(),
        updated_by = auth.uid(),
        updated_at = NOW()
      WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  END CASE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND_IN_CYCLE';
  END IF;
END;
$$;

-- Helper function to get valid next states for a service
CREATE OR REPLACE FUNCTION public.get_valid_transitions(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS TABLE(
  state TEXT,
  label TEXT,
  requires_dependencies BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_state deploy_state;
  has_unmet_deps BOOLEAN := false;
BEGIN
  -- Get current state
  SELECT sd.state INTO current_state
  FROM service_deployments sd
  WHERE sd.cycle_id = p_cycle_id AND sd.service_id = p_service_id;

  -- Check if there are unmet dependencies
  SELECT EXISTS (
    SELECT 1
    FROM microservice_deps d
    JOIN service_deployments sd
      ON sd.service_id = d.depends_on_service_id
     AND sd.cycle_id = p_cycle_id
    WHERE d.cycle_id = p_cycle_id
      AND d.service_id = p_service_id
      AND sd.state <> 'deployed'
  ) INTO has_unmet_deps;

  -- Return valid transitions based on current state
  CASE current_state
    WHEN 'not_ready' THEN
      RETURN QUERY VALUES 
        ('ready', 'Mark Ready', false);

    WHEN 'ready' THEN
      RETURN QUERY VALUES 
        ('not_ready', 'Reset to Not Ready', false),
        ('triggered', 'Start Deployment', true);

    WHEN 'triggered' THEN
      RETURN QUERY VALUES 
        ('not_ready', 'Reset to Not Ready', false),
        ('ready', 'Reset to Ready', false),
        ('deployed', 'Mark Deployed', false),
        ('failed', 'Mark Failed', false);

    WHEN 'deployed' THEN
      RETURN QUERY VALUES 
        ('not_ready', 'Reset to Not Ready', false),
        ('ready', 'Reset to Ready', false),
        ('triggered', 'Restart Deployment', true);

    WHEN 'failed' THEN
      RETURN QUERY VALUES 
        ('not_ready', 'Reset to Not Ready', false),
        ('ready', 'Reset to Ready', false),
        ('triggered', 'Retry Deployment', true);

  END CASE;
END;
$$; 