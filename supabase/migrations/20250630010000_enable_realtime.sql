/*
  # Enable Real-time for Tables

  This migration explicitly enables real-time subscriptions for the tables
  that need real-time updates in the deployment board.
*/

-- Enable real-time for service_deployments table
ALTER PUBLICATION supabase_realtime ADD TABLE service_deployments;

-- Enable real-time for microservice_deps table  
ALTER PUBLICATION supabase_realtime ADD TABLE microservice_deps;

-- Also enable for related tables that might be useful
ALTER PUBLICATION supabase_realtime ADD TABLE deployment_cycles;
ALTER PUBLICATION supabase_realtime ADD TABLE cycle_services; 