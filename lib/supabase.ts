// Type definitions for Supabase database schema
// Note: Use utils/supabase/client.ts for actual client instances

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
          cycle_id: string;
          service_id: string;
          depends_on_service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          service_id: string;
          depends_on_service_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
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
          is_active: boolean;
          completed_at: string | null;
          completed_by: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          label: string;
          created_by?: string;
          created_at?: string;
          is_active?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          label?: string;
          created_by?: string;
          created_at?: string;
          is_active?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
        };
      };
      service_deployments: {
        Row: {
          id: string;
          cycle_id: string;
          service_id: string;
          state: 'not_ready' | 'ready' | 'triggered' | 'deployed';
          started_at: string | null;
          finished_at: string | null;
          updated_by: string | null;
          updated_at: string;
          tasks: TaskItem[];
        };
        Insert: {
          id?: string;
          cycle_id: string;
          service_id: string;
          state?: 'not_ready' | 'ready' | 'triggered' | 'deployed';
          started_at?: string | null;
          finished_at?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          tasks?: TaskItem[];
        };
        Update: {
          id?: string;
          cycle_id?: string;
          service_id?: string;
          state?: 'not_ready' | 'ready' | 'triggered' | 'deployed';
          started_at?: string | null;
          finished_at?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          tasks?: TaskItem[];
        };
      };
      cycle_services: {
        Row: {
          id: string;
          cycle_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          service_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      v_deployments: {
        Row: {
          id: string;
          cycle_id: string;
          service_id: string;
          state: 'not_ready' | 'ready' | 'triggered' | 'deployed';
          started_at: string | null;
          finished_at: string | null;
          updated_by: string | null;
          updated_at: string;
          service_name: string;
          service_description: string;
          cycle_label: string;
          cycle_created_at: string;
          updated_by_email: string | null;
          added_to_cycle_at: string;
          tasks: TaskItem[];
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

      create_deployment_cycle: {
        Args: {
          p_label: string;
        };
        Returns: string;
      };
      create_microservice: {
        Args: {
          p_name: string;
          p_description?: string;
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
      add_service_to_cycle: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: void;
      };
      remove_service_from_cycle: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: void;
      };
      get_tenant_services: {
        Args: {};
        Returns: {
          id: string;
          name: string;
          description: string;
          created_at: string;
          in_cycles: number;
        }[];
      };
      get_cycle_services: {
        Args: {
          p_cycle_id: string;
        };
        Returns: {
          id: string;
          name: string;
          description: string;
          created_at: string;
          deployment_state: string;
        }[];
      };
      get_available_services_for_cycle: {
        Args: {
          p_cycle_id: string;
        };
        Returns: {
          id: string;
          name: string;
          description: string;
          created_at: string;
        }[];
      };
      copy_services_to_cycle: {
        Args: {
          p_source_cycle_id: string;
          p_target_cycle_id: string;
        };
        Returns: void;
      };
      activate_cycle: {
        Args: {
          p_cycle_id: string;
        };
        Returns: void;
      };
      get_active_cycle: {
        Args: {};
        Returns: {
          id: string;
          tenant_id: string;
          label: string;
          created_by: string;
          created_at: string;
          is_active: boolean;
        }[];
      };
      add_task_to_service: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
          p_task_text: string;
        };
        Returns: string;
      };
      remove_task_from_service: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
          p_task_id: string;
        };
        Returns: void;
      };
      update_task_completion: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
          p_task_id: string;
          p_completed: boolean;
        };
        Returns: void;
      };
      update_task_text: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
          p_task_id: string;
          p_task_text: string;
        };
        Returns: void;
      };
      get_service_tasks: {
        Args: {
          p_cycle_id: string;
          p_service_id: string;
        };
        Returns: TaskItem[];
      };
    };
  };
};

export type DeploymentState = 'not_ready' | 'ready' | 'triggered' | 'deployed';

export type TaskItem = {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
};

export type ServiceDeployment = Database['public']['Tables']['service_deployments']['Row'];
export type Microservice = Database['public']['Tables']['microservices']['Row'];
export type DeploymentCycle = Database['public']['Tables']['deployment_cycles']['Row'];
export type MicroserviceDep = Database['public']['Tables']['microservice_deps']['Row'];
export type CycleService = Database['public']['Tables']['cycle_services']['Row'];
export type DeploymentView = Database['public']['Views']['v_deployments']['Row'];

// Extended types for the new functions
export type TenantService = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  in_cycles: number;
};

export type CycleServiceWithState = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  deployment_state: string;
};
