/*
  # Add Update Cycle Function

  1. New Functions
    - update_cycle_name: Update the label/name of an existing deployment cycle
  
  2. Security
    - Ensures user has access to tenant before updating
    - RLS policies will handle tenant isolation
    - Prevents updating completed cycles
*/

-- Function to update cycle name/label
CREATE OR REPLACE FUNCTION public.update_cycle_name(
  p_cycle_id UUID,
  p_label TEXT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cycle_tenant_id UUID;
  user_tenant_id UUID;
  cycle_completed BOOLEAN;
BEGIN
  -- Get the tenant ID and completion status for the cycle
  SELECT tenant_id, completed_at IS NOT NULL INTO cycle_tenant_id, cycle_completed
  FROM deployment_cycles
  WHERE id = p_cycle_id;

  IF cycle_tenant_id IS NULL THEN
    RAISE EXCEPTION 'CYCLE_NOT_FOUND';
  END IF;

  -- Prevent updating completed cycles
  IF cycle_completed THEN
    RAISE EXCEPTION 'CANNOT_UPDATE_COMPLETED_CYCLE';
  END IF;

  -- Get the user's tenant ID
  SELECT tenant_id INTO user_tenant_id
  FROM auth.users u
  JOIN tenant_members tm ON tm.user_id = u.id
  WHERE u.id = auth.uid();

  IF user_tenant_id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_IN_TENANT';
  END IF;

  -- Verify user has access to this cycle's tenant
  IF cycle_tenant_id != user_tenant_id THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  -- Validate inputs
  IF p_label IS NULL OR trim(p_label) = '' THEN
    RAISE EXCEPTION 'CYCLE_LABEL_REQUIRED';
  END IF;

  -- Check if label is already taken by another cycle in the same tenant
  IF EXISTS (
    SELECT 1 FROM deployment_cycles 
    WHERE tenant_id = cycle_tenant_id 
    AND label = trim(p_label) 
    AND id != p_cycle_id
  ) THEN
    RAISE EXCEPTION 'CYCLE_LABEL_ALREADY_EXISTS';
  END IF;

  -- Update the deployment cycle
  UPDATE deployment_cycles
  SET 
    label = trim(p_label)
  WHERE id = p_cycle_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CYCLE_UPDATE_FAILED';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_cycle_name(UUID, TEXT) TO authenticated; 