/*
  # Optimize Database Indexes

  This migration addresses database linter warnings by:
  1. Adding indexes for frequently queried foreign key constraints
  2. Removing unused indexes that consume storage and slow down writes
  3. Optimizing query performance for common access patterns

  Issues fixed:
  - unindexed_foreign_keys: Add covering indexes for foreign key constraints
  - unused_index: Remove unused indexes that provide no benefit
*/

-- Remove unused index that has never been used
DROP INDEX IF EXISTS sd_cycle_state_idx;

-- Add indexes for foreign key constraints that are frequently queried
-- These indexes will improve JOIN performance and foreign key constraint checks

-- Index for cycle_services.service_id (used in JOINs with microservices)
CREATE INDEX IF NOT EXISTS idx_cycle_services_service_id 
ON cycle_services(service_id);

-- Index for service_deployments.service_id (used in JOINs with microservices)  
CREATE INDEX IF NOT EXISTS idx_service_deployments_service_id 
ON service_deployments(service_id);

-- Index for tenant_members.user_id (used frequently in RLS policies and user lookups)
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id 
ON tenant_members(user_id);

-- Composite index for service_deployments (cycle_id, service_id) for better JOIN performance
-- This covers the unique constraint and common query patterns
CREATE INDEX IF NOT EXISTS idx_service_deployments_cycle_service 
ON service_deployments(cycle_id, service_id);

-- Index for deployment_cycles.tenant_id and is_active (used in getting active cycles)
CREATE INDEX IF NOT EXISTS idx_deployment_cycles_tenant_active 
ON deployment_cycles(tenant_id, is_active);

-- Note: We're NOT adding indexes for these foreign keys because they're rarely queried:
-- - deployment_cycles.completed_by (only used for audit trails)
-- - deployment_cycles.created_by (only used for audit trails)  
-- - service_deployments.updated_by (only used for audit trails)
-- These would consume storage and slow down writes without providing query benefits

-- Add comments to document the optimization decisions
COMMENT ON INDEX idx_cycle_services_service_id IS 
'Covers foreign key constraint and improves JOIN performance with microservices';

COMMENT ON INDEX idx_service_deployments_service_id IS 
'Covers foreign key constraint and improves JOIN performance with microservices';

COMMENT ON INDEX idx_tenant_members_user_id IS 
'Covers foreign key constraint and improves RLS policy performance';

COMMENT ON INDEX idx_service_deployments_cycle_service IS 
'Composite index for common query patterns involving cycle and service lookups';

COMMENT ON INDEX idx_deployment_cycles_tenant_active IS 
'Optimizes queries for active cycles per tenant, commonly used in application logic'; 