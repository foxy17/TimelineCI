/*
  # Remove Failed State and Add Tasks System

  1. Schema Changes
    - Remove 'failed' from deploy_state enum
    - Add tasks JSONB column to service_deployments table
    - Create functions to manage tasks

  2. Function Updates
    - Remove all functions that reference 'failed' state
    - Update existing functions to remove 'failed' references
    - Add functions to manage tasks (add, remove, update completion)

  3. Data Migration
    - Convert any existing 'failed' state services to 'not_ready'
    - Initialize empty tasks array for existing deployments

  4. Tasks Structure
    - tasks: [{ id: string, text: string, completed: boolean, created_at: timestamp }]
*/

-- First, migrate any existing 'failed' state services to 'not_ready'
UPDATE service_deployments 
SET state = 'not_ready', finished_at = NULL
WHERE state = 'failed';

-- Drop all views that might depend on the state column before modifying the enum type
-- This includes any views that reference service_deployments table
DROP VIEW IF EXISTS v_deployments;
DROP VIEW IF EXISTS v_deployments_client;
DROP VIEW IF EXISTS deployments_view;
DROP VIEW IF EXISTS service_deployments_view;

-- Dynamically find and drop any other views that depend on service_deployments
DO $$
DECLARE
  view_name TEXT;
BEGIN
  FOR view_name IN 
    SELECT DISTINCT v.view_name
    FROM information_schema.view_table_usage v
    WHERE v.table_name = 'service_deployments'
    AND v.table_schema = 'public'
    AND v.view_schema = 'public'
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_name);
  END LOOP;
END $$;

-- Drop the old enum and recreate it without 'failed'
ALTER TYPE deploy_state RENAME TO deploy_state_old;

CREATE TYPE deploy_state AS ENUM (
  'not_ready',
  'ready', 
  'triggered',
  'deployed'
);

-- First, drop the default constraint for the state column
ALTER TABLE service_deployments ALTER COLUMN state DROP DEFAULT;

-- Update the service_deployments table to use the new enum
ALTER TABLE service_deployments 
  ALTER COLUMN state TYPE deploy_state 
  USING state::text::deploy_state;

-- Add back the default constraint
ALTER TABLE service_deployments ALTER COLUMN state SET DEFAULT 'not_ready';

-- Drop the old enum
DROP TYPE deploy_state_old;

-- Add tasks column to service_deployments
ALTER TABLE service_deployments ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;

-- Initialize empty tasks array for existing deployments
UPDATE service_deployments SET tasks = '[]'::jsonb WHERE tasks IS NULL;

-- Make tasks column NOT NULL
ALTER TABLE service_deployments ALTER COLUMN tasks SET NOT NULL;

-- Drop functions that reference 'failed' state
DROP FUNCTION IF EXISTS public.mark_failed(UUID, UUID);

-- Update transition_service_state function to remove 'failed' references
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

  -- Validate target state (removed 'failed')
  IF p_target_state NOT IN ('not_ready', 'ready', 'triggered', 'deployed') THEN
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

  END CASE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND_IN_CYCLE';
  END IF;
END;
$$;

-- Update get_valid_transitions function to remove 'failed' references
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

  -- Return valid transitions based on current state (removed 'failed' references)
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
        ('deployed', 'Mark Deployed', false);

    WHEN 'deployed' THEN
      RETURN QUERY VALUES 
        ('not_ready', 'Reset to Not Ready', false),
        ('ready', 'Reset to Ready', false),
        ('triggered', 'Restart Deployment', true);

  END CASE;
END;
$$;

-- Update reset_service_to_triggered function to remove 'failed' references
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

  -- Only allow reset to triggered from deployed or ready states (removed 'failed')
  IF current_state NOT IN ('deployed', 'ready') THEN
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

-- Functions to manage tasks
CREATE OR REPLACE FUNCTION public.add_task_to_service(
  p_cycle_id UUID,
  p_service_id UUID,
  p_task_text TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_task_id UUID;
  v_current_tasks JSONB;
  v_new_task JSONB;
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Generate new task ID
  v_task_id := uuid_generate_v4();
  
  -- Get current tasks
  SELECT tasks INTO v_current_tasks
  FROM service_deployments
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  -- Create new task object
  v_new_task := jsonb_build_object(
    'id', v_task_id,
    'text', p_task_text,
    'completed', false,
    'created_at', NOW()
  );

  -- Add new task to tasks array
  UPDATE service_deployments
  SET 
    tasks = v_current_tasks || jsonb_build_array(v_new_task),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  RETURN v_task_id;
END;
$$;

-- Function to remove a task
CREATE OR REPLACE FUNCTION public.remove_task_from_service(
  p_cycle_id UUID,
  p_service_id UUID,
  p_task_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_tasks JSONB;
  v_updated_tasks JSONB;
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Get current tasks
  SELECT tasks INTO v_current_tasks
  FROM service_deployments
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  -- Remove the task with matching ID
  SELECT jsonb_agg(task) INTO v_updated_tasks
  FROM jsonb_array_elements(v_current_tasks) task
  WHERE (task->>'id')::uuid != p_task_id;

  -- Update with filtered tasks
  UPDATE service_deployments
  SET 
    tasks = COALESCE(v_updated_tasks, '[]'::jsonb),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;
END;
$$;

-- Function to update task completion status
CREATE OR REPLACE FUNCTION public.update_task_completion(
  p_cycle_id UUID,
  p_service_id UUID,
  p_task_id UUID,
  p_completed BOOLEAN
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_tasks JSONB;
  v_updated_tasks JSONB;
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Get current tasks
  SELECT tasks INTO v_current_tasks
  FROM service_deployments
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  -- Update the specific task's completion status
  SELECT jsonb_agg(
    CASE 
      WHEN (task->>'id')::uuid = p_task_id 
      THEN jsonb_set(task, '{completed}', to_jsonb(p_completed))
      ELSE task
    END
  ) INTO v_updated_tasks
  FROM jsonb_array_elements(v_current_tasks) task;

  -- Update with modified tasks
  UPDATE service_deployments
  SET 
    tasks = COALESCE(v_updated_tasks, '[]'::jsonb),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;
END;
$$;

-- Function to update task text
CREATE OR REPLACE FUNCTION public.update_task_text(
  p_cycle_id UUID,
  p_service_id UUID,
  p_task_id UUID,
  p_task_text TEXT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_tasks JSONB;
  v_updated_tasks JSONB;
BEGIN
  -- Verify service is part of this cycle
  IF NOT EXISTS (
    SELECT 1 FROM cycle_services 
    WHERE cycle_id = p_cycle_id AND service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NOT_IN_CYCLE';
  END IF;

  -- Get current tasks
  SELECT tasks INTO v_current_tasks
  FROM service_deployments
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;

  -- Update the specific task's text
  SELECT jsonb_agg(
    CASE 
      WHEN (task->>'id')::uuid = p_task_id 
      THEN jsonb_set(task, '{text}', to_jsonb(p_task_text))
      ELSE task
    END
  ) INTO v_updated_tasks
  FROM jsonb_array_elements(v_current_tasks) task;

  -- Update with modified tasks
  UPDATE service_deployments
  SET 
    tasks = COALESCE(v_updated_tasks, '[]'::jsonb),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_cycle_id AND service_id = p_service_id;
END;
$$;

-- Function to get tasks for a service in a cycle
CREATE OR REPLACE FUNCTION public.get_service_tasks(
  p_cycle_id UUID,
  p_service_id UUID
)
RETURNS TABLE(
  id UUID,
  text TEXT,
  completed BOOLEAN,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (task->>'id')::uuid as id,
    task->>'text' as text,
    (task->>'completed')::boolean as completed,
    (task->>'created_at')::timestamptz as created_at
  FROM service_deployments sd,
       jsonb_array_elements(sd.tasks) task
  WHERE sd.cycle_id = p_cycle_id 
    AND sd.service_id = p_service_id
  ORDER BY (task->>'created_at')::timestamptz;
END;
$$;

-- Function to copy tasks from one cycle to another for a service
CREATE OR REPLACE FUNCTION public.copy_tasks_to_cycle(
  p_source_cycle_id UUID,
  p_target_cycle_id UUID,
  p_service_id UUID
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_source_tasks JSONB;
  v_new_tasks JSONB;
BEGIN
  -- Get tasks from source cycle
  SELECT tasks INTO v_source_tasks
  FROM service_deployments
  WHERE cycle_id = p_source_cycle_id AND service_id = p_service_id;

  -- Reset completion status and update IDs for new cycle
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', uuid_generate_v4(),
      'text', task->>'text',
      'completed', false,
      'created_at', NOW()
    )
  ) INTO v_new_tasks
  FROM jsonb_array_elements(v_source_tasks) task;

  -- Update target cycle with copied tasks
  UPDATE service_deployments
  SET 
    tasks = COALESCE(v_new_tasks, '[]'::jsonb),
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE cycle_id = p_target_cycle_id AND service_id = p_service_id;
END;
$$;

-- Recreate the v_deployments view with the new tasks column
CREATE VIEW v_deployments AS
SELECT 
  d.cycle_id,
  d.service_id,
  d.state,
  d.started_at,
  d.finished_at,
  d.updated_by,
  d.updated_at,
  d.tasks,
  s.name AS service_name,
  s.description AS service_description,
  c.label AS cycle_label,
  c.created_at AS cycle_created_at,
  -- Use the safe email function
  COALESCE(
    get_user_email_safe(d.updated_by),
    'Unknown'
  ) AS updated_by_email,
  cs.created_at AS added_to_cycle_at
FROM service_deployments d
JOIN microservices s ON s.id = d.service_id
JOIN deployment_cycles c ON c.id = d.cycle_id
JOIN cycle_services cs ON cs.cycle_id = d.cycle_id AND cs.service_id = d.service_id; 