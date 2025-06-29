/*
  # Fix RLS Policies for Tenant Resolution

  The existing RLS policies expect tenant_id to be in JWT claims, but the 
  tenant resolution functions (get_current_tenant_id, ensure_tenant_setup)
  work by looking up tenant membership based on user email domain.

  This migration updates the RLS policies to work with tenant membership
  instead of requiring tenant_id in JWT claims.
*/

-- Update RLS policies to work with dynamic tenant resolution
-- Drop existing policies that rely on JWT claims
DROP POLICY IF EXISTS "tenant_isolation_deployment_cycles" ON deployment_cycles;
DROP POLICY IF EXISTS "tenant_isolation_microservices" ON microservices;
DROP POLICY IF EXISTS "tenant_isolation_service_deployments" ON service_deployments;
DROP POLICY IF EXISTS "tenant_isolation_microservice_deps" ON microservice_deps;
DROP POLICY IF EXISTS "tenant_isolation_tenant_members" ON tenant_members;
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON tenants;

-- Create new flexible policies that use tenant membership
CREATE POLICY "tenant_access_deployment_cycles" ON deployment_cycles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = deployment_cycles.tenant_id
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "tenant_access_microservices" ON microservices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = microservices.tenant_id
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "tenant_access_service_deployments" ON service_deployments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c
    JOIN tenant_members tm ON tm.tenant_id = c.tenant_id
    WHERE c.id = service_deployments.cycle_id
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "tenant_access_microservice_deps" ON microservice_deps
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c
    JOIN tenant_members tm ON tm.tenant_id = c.tenant_id
    WHERE c.id = microservice_deps.cycle_id
    AND tm.user_id = auth.uid()
  )
);

-- Ensure tenant_members and tenants policies allow access for tenant setup
CREATE POLICY "user_tenant_members" ON tenant_members
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "accessible_tenants" ON tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tenants.id
    AND tm.user_id = auth.uid()
  )
);
