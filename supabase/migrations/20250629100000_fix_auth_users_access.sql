/*
  # Fix auth.users Access Issue

  The v_deployments view is trying to access auth.users table which may have
  column access issues. This migration updates the view to safely access
  auth.users.email without causing user_metadata column errors.

  Changes:
  - Update v_deployments view to handle auth.users access more safely
  - Add error handling for auth.users column access
*/

-- Drop and recreate the v_deployments view with safer auth.users access
DROP VIEW IF EXISTS v_deployments;

CREATE VIEW v_deployments AS
SELECT 
  d.cycle_id,
  d.service_id,
  d.state,
  d.started_at,
  d.finished_at,
  d.updated_by,
  d.updated_at,
  s.name AS service_name,
  s.description AS service_description,
  c.label AS cycle_label,
  c.created_at AS cycle_created_at,
  -- Safely get email from auth.users without accessing user_metadata
  COALESCE(
    (SELECT email FROM auth.users WHERE id = d.updated_by LIMIT 1),
    'Unknown'
  ) AS updated_by_email,
  cs.created_at AS added_to_cycle_at
FROM service_deployments d
JOIN microservices s ON s.id = d.service_id
JOIN deployment_cycles c ON c.id = d.cycle_id
JOIN cycle_services cs ON cs.cycle_id = d.cycle_id AND cs.service_id = d.service_id;

-- Also ensure the ensure_tenant_setup function safely accesses auth.users
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
  
  -- Safely get user email from auth.users
  BEGIN
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = v_user_id;
  EXCEPTION
    WHEN others THEN
      RAISE EXCEPTION 'USER_EMAIL_ACCESS_ERROR: %', SQLERRM;
  END;
  
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