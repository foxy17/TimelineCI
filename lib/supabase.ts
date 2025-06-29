import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          email_domain: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email_domain: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email_domain?: string;
          created_at?: string;
        };
      };
      tenant_members: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: 'ADMIN' | 'EDITOR' | 'VIEWER';
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: 'ADMIN' | 'EDITOR' | 'VIEWER';
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: 'ADMIN' | 'EDITOR' | 'VIEWER';
          created_at?: string;
        };
      };
      microservices: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      microservice_deps: {
        Row: {
          id: string;
          service_id: string;
          depends_on_service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          depends_on_service_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          depends_on_service_id?: string;
          created_at?: string;
        };
      };
      deployment_cycles: {
        Row: {
          id: string;
          tenant_id: string;
          label: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          label: string;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          label?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      service_deployments: {
        Row: {
          id: string;
          cycle_id: string;
          service_id: string;
          state: 'not_ready' | 'ready' | 'triggered' | 'deployed' | 'failed';
          started_at: string | null;
          finished_at: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          service_id: string;
          state?: 'not_ready' | 'ready' | 'triggered' | 'deployed' | 'failed';
          started_at?: string | null;
          finished_at?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          service_id?: string;
          state?: 'not_ready' | 'ready' | 'triggered' | 'deployed' | 'failed';
          started_at?: string | null;
          finished_at?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      v_deployments: {
        Row: {
          id: string;
          cycle_id: string;
          service_id: string;
          state: 'not_ready' | 'ready' | 'triggered' | 'deployed' | 'failed';
          started_at: string | null;
          finished_at: string | null;
          updated_by: string | null;
          updated_at: string;
          service_name: string;
          service_description: string;
          cycle_label: string;
          cycle_created_at: string;
          updated_by_email: string | null;
        };
      };
    };
    Functions: {
      set_service_ready: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: void;
      };
      start_deployment: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: void;
      };
      mark_deployed: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: void;
      };
      mark_failed: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: void;
      };
      create_deployment_cycle: {
        Args: {
          p_label: string;
        };
        Returns: string;
      };
      get_unmet_dependencies: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: {
          service_name: string;
          service_id: string;
        }[];
      };
    };
  };
};

export type DeploymentState = 'not_ready' | 'ready' | 'triggered' | 'deployed' | 'failed';

export type ServiceDeployment = Database['public']['Tables']['service_deployments']['Row'];
export type Microservice = Database['public']['Tables']['microservices']['Row'];
export type DeploymentCycle = Database['public']['Tables']['deployment_cycles']['Row'];
export type MicroserviceDep = Database['public']['Tables']['microservice_deps']['Row'];
export type DeploymentView = Database['public']['Views']['v_deployments']['Row'];