/*
  # Add Update Microservice Function

  1. New Functions
    - update_microservice: Update name and description of an existing microservice
  
  2. Security
    - Ensures user has access to tenant before updating
    - RLS policies will handle tenant isolation
*/

-- Function to update microservice details
CREATE OR REPLACE FUNCTION public.update_microservice(
  p_service_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  service_tenant_id UUID;
  user_tenant_id UUID;
BEGIN
  -- Get the tenant ID for the service
  SELECT tenant_id INTO service_tenant_id
  FROM microservices
  WHERE id = p_service_id;

  IF service_tenant_id IS NULL THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND';
  END IF;

  -- Get the user's tenant ID
  SELECT tenant_id INTO user_tenant_id
  FROM auth.users u
  JOIN tenant_members tm ON tm.user_id = u.id
  WHERE u.id = auth.uid();

  IF user_tenant_id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_IN_TENANT';
  END IF;

  -- Verify user has access to this service's tenant
  IF service_tenant_id != user_tenant_id THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  -- Validate inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'SERVICE_NAME_REQUIRED';
  END IF;

  -- Check if name is already taken by another service in the same tenant
  IF EXISTS (
    SELECT 1 FROM microservices 
    WHERE tenant_id = service_tenant_id 
    AND name = trim(p_name) 
    AND id != p_service_id
  ) THEN
    RAISE EXCEPTION 'SERVICE_NAME_ALREADY_EXISTS';
  END IF;

  -- Update the microservice
  UPDATE microservices
  SET 
    name = trim(p_name),
    description = COALESCE(trim(p_description), ''),
    updated_at = NOW()
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_UPDATE_FAILED';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_microservice(UUID, TEXT, TEXT) TO authenticated; 