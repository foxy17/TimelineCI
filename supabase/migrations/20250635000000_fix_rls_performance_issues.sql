/*
  # Fix RLS Performance Issues

  This migration fixes the database linter warnings by:
  1. Removing multiple permissive policies on the same table
  2. Optimizing auth.uid() calls to use (select auth.uid()) to avoid re-evaluation
  3. Ensuring only one policy exists per table for optimal performance

  Issues fixed:
  - auth_rls_initplan: Auth RLS Initialization Plan warnings
  - multiple_permissive_policies: Multiple Permissive Policies warnings
*/

-- First, drop ALL existing policies on all affected tables to start clean
-- This ensures we don't have multiple policies causing performance issues

-- Drop all policies on deployment_cycles
DROP POLICY IF EXISTS "tenant_isolation_deployment_cycles" ON deployment_cycles;
DROP POLICY IF EXISTS "tenant_access_deployment_cycles" ON deployment_cycles;
DROP POLICY IF EXISTS "tenant_isolation_cycles" ON deployment_cycles;

-- Drop all policies on microservices
DROP POLICY IF EXISTS "tenant_isolation_microservices" ON microservices;
DROP POLICY IF EXISTS "tenant_access_microservices" ON microservices;
DROP POLICY IF EXISTS "tenant_isolation_services" ON microservices;

-- Drop all policies on microservice_deps
DROP POLICY IF EXISTS "tenant_isolation_microservice_deps" ON microservice_deps;
DROP POLICY IF EXISTS "tenant_access_microservice_deps" ON microservice_deps;
DROP POLICY IF EXISTS "tenant_isolation_deps" ON microservice_deps;

-- Drop all policies on service_deployments
DROP POLICY IF EXISTS "tenant_isolation_service_deployments" ON service_deployments;
DROP POLICY IF EXISTS "tenant_access_service_deployments" ON service_deployments;

-- Drop all policies on tenant_members
DROP POLICY IF EXISTS "tenant_isolation_tenant_members" ON tenant_members;
DROP POLICY IF EXISTS "user_tenant_members" ON tenant_members;
DROP POLICY IF EXISTS "tenant_isolation_members" ON tenant_members;

-- Drop all policies on tenants
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON tenants;
DROP POLICY IF EXISTS "accessible_tenants" ON tenants;

-- Drop all policies on cycle_services
DROP POLICY IF EXISTS "tenant_access_cycle_services" ON cycle_services;

-- Now create optimized policies with (select auth.uid()) to avoid per-row re-evaluation
-- Using subquery form prevents the function from being called for each row

-- Optimized policy for deployment_cycles
CREATE POLICY "tenant_access_deployment_cycles" ON deployment_cycles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = deployment_cycles.tenant_id
    AND tm.user_id = (select auth.uid())
  )
);

-- Optimized policy for microservices
CREATE POLICY "tenant_access_microservices" ON microservices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = microservices.tenant_id
    AND tm.user_id = (select auth.uid())
  )
);

-- Optimized policy for microservice_deps
CREATE POLICY "tenant_access_microservice_deps" ON microservice_deps
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c
    JOIN tenant_members tm ON tm.tenant_id = c.tenant_id
    WHERE c.id = microservice_deps.cycle_id
    AND tm.user_id = (select auth.uid())
  )
);

-- Optimized policy for service_deployments
CREATE POLICY "tenant_access_service_deployments" ON service_deployments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c
    JOIN tenant_members tm ON tm.tenant_id = c.tenant_id
    WHERE c.id = service_deployments.cycle_id
    AND tm.user_id = (select auth.uid())
  )
);

-- Optimized policy for tenant_members
CREATE POLICY "user_tenant_members" ON tenant_members
FOR ALL USING (user_id = (select auth.uid()));

-- Optimized policy for tenants
CREATE POLICY "accessible_tenants" ON tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tenants.id
    AND tm.user_id = (select auth.uid())
  )
);

-- Optimized policy for cycle_services
CREATE POLICY "tenant_access_cycle_services" ON cycle_services
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c
    JOIN tenant_members tm ON tm.tenant_id = c.tenant_id
    WHERE c.id = cycle_services.cycle_id
    AND tm.user_id = (select auth.uid())
  )
);

-- Add comment to track the optimization
COMMENT ON POLICY "tenant_access_deployment_cycles" ON deployment_cycles IS 
'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON POLICY "tenant_access_microservices" ON microservices IS 
'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON POLICY "tenant_access_microservice_deps" ON microservice_deps IS 
'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON POLICY "tenant_access_service_deployments" ON service_deployments IS 
'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON POLICY "user_tenant_members" ON tenant_members IS 
'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON POLICY "accessible_tenants" ON tenants IS 
'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';

COMMENT ON POLICY "tenant_access_cycle_services" ON cycle_services IS 
'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation'; 