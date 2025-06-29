/*
  # Deployment Visibility Dashboard - Initial Schema

  1. New Tables
    - `tenants` - Multi-tenant organization structure
    - `tenant_members` - User-tenant relationships with roles
    - `microservices` - Service definitions per tenant
    - `microservice_deps` - Dependency relationships between services
    - `deployment_cycles` - Release cycles (e.g., "2025-W28")
    - `service_deployments` - State tracking for services within cycles

  2. Security
    - Enable RLS on all tables
    - Tenant isolation policies using JWT claims
    - Role-based access control

  3. Functions
    - Deployment state management with dependency validation
    - Automated cycle initialization
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────
-- 1. Multitenancy
-- ───────────────────────────
CREATE TABLE tenants (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  email_domain TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT CHECK(role IN ('ADMIN','EDITOR','VIEWER')) DEFAULT 'VIEWER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- ───────────────────────────
-- 2. Services & Dependencies
-- ───────────────────────────
CREATE TABLE microservices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE microservice_deps (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id            UUID REFERENCES microservices(id) ON DELETE CASCADE,
  depends_on_service_id UUID REFERENCES microservices(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_dep CHECK(service_id <> depends_on_service_id),
  UNIQUE(service_id, depends_on_service_id)
);

-- ───────────────────────────
-- 3. Deployment Cycles & States
-- ───────────────────────────
DO $$ BEGIN
  CREATE TYPE deploy_state AS ENUM (
    'not_ready',
    'ready', 
    'triggered',
    'deployed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE deployment_cycles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, label)
);

CREATE TABLE service_deployments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id    UUID REFERENCES deployment_cycles(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES microservices(id) ON DELETE CASCADE,
  state       deploy_state DEFAULT 'not_ready',
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_by  UUID REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, service_id)
);

-- Helpful view for deployment data
CREATE VIEW v_deployments AS
SELECT 
  d.*,
  s.name AS service_name,
  s.description AS service_description,
  c.label AS cycle_label,
  c.created_at AS cycle_created_at,
  u.email AS updated_by_email
FROM service_deployments d
JOIN microservices s ON s.id = d.service_id
JOIN deployment_cycles c ON c.id = d.cycle_id
LEFT JOIN auth.users u ON u.id = d.updated_by;

-- ───────────────────────────
-- 4. Row Level Security
-- ───────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE microservices ENABLE ROW LEVEL SECURITY;
ALTER TABLE microservice_deps ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_deployments ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY "tenant_isolation_tenants" ON tenants
FOR ALL USING (
  id = ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid
);

CREATE POLICY "tenant_isolation_tenant_members" ON tenant_members
FOR ALL USING (
  tenant_id = ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid
);

CREATE POLICY "tenant_isolation_microservices" ON microservices
FOR ALL USING (
  tenant_id = ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid
);

CREATE POLICY "tenant_isolation_microservice_deps" ON microservice_deps
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM microservices s 
    WHERE s.id = service_id 
    AND s.tenant_id = ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid
  )
);

CREATE POLICY "tenant_isolation_deployment_cycles" ON deployment_cycles
FOR ALL USING (
  tenant_id = ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid
);

CREATE POLICY "tenant_isolation_service_deployments" ON service_deployments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM deployment_cycles c 
    WHERE c.id = cycle_id 
    AND c.tenant_id = ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid
  )
);

-- ───────────────────────────
-- 5. Core Functions
-- ───────────────────────────

-- Function to set service as ready
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

-- Function to start deployment with dependency validation
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

  -- 2. Count dependencies not yet deployed within same cycle
  SELECT COUNT(*) INTO blockers
  FROM microservice_deps d
  JOIN service_deployments sd
    ON sd.service_id = d.depends_on_service_id
   AND sd.cycle_id = p_cycle_id
  WHERE d.service_id = p_service_id
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

-- Function to mark deployment as completed
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

-- Function to mark deployment as failed
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

-- Function to create new deployment cycle
CREATE OR REPLACE FUNCTION public.create_deployment_cycle(
  p_label TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
  v_cycle_id UUID;
  v_service RECORD;
BEGIN
  -- Get tenant ID from JWT
  v_tenant_id := ((current_setting('request.jwt.claims', true))::json->>'tenant_id')::uuid;
  
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

-- Function to get unmet dependencies
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
  WHERE d.service_id = p_service_id
    AND sd.cycle_id = p_cycle_id
    AND sd.state <> 'deployed';
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_deployments_updated_at
BEFORE UPDATE ON service_deployments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();