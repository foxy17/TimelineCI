/*
  # Fix Function Search Path Security Warnings

  This migration fixes the "function_search_path_mutable" security warnings
  by setting the search_path parameter for all functions using ALTER FUNCTION.
  
  The search_path includes:
  - public: For user-defined functions and tables
  - extensions: For extension functions like uuid_generate_v4()
  - pg_catalog: For built-in PostgreSQL functions
  - pg_temp: For temporary objects
  
  This ensures functions can access all necessary schemas while maintaining security.
*/

-- Fix all functions with error handling for missing functions
DO $$
DECLARE
  func_name TEXT;
  func_signature TEXT;
  functions_to_fix TEXT[] := ARRAY[
    'update_microservice(UUID, TEXT, TEXT)',
    'update_cycle_name(UUID, TEXT)', 
    'copy_dependencies_to_cycle(UUID, UUID)',
    'remove_service_from_cycle(UUID, UUID)',
    'get_tenant_services()',
    'get_cycle_services(UUID)',
    'create_microservice(TEXT, TEXT)',
    'get_available_services_for_cycle(UUID)',
    'copy_services_to_cycle(UUID, UUID)',
    'get_current_tenant_id()',
    'deactivate_other_cycles(UUID, UUID)',
    'get_active_cycle()',
    'add_service_to_cycle(UUID, UUID)',
    'activate_cycle(UUID)',
    'create_deployment_cycle(TEXT)',
    'get_user_email_safe(UUID)',
    'ensure_tenant_setup()',
    'set_service_dependencies(UUID, UUID, UUID[])',
    'set_service_ready(UUID, UUID)',
    'start_deployment(UUID, UUID)',
    'mark_deployed(UUID, UUID)',
    'get_unmet_dependencies(UUID, UUID)',
    'add_task_to_service(UUID, UUID, TEXT)',
    'remove_task_from_service(UUID, UUID, UUID)',
    'update_task_completion(UUID, UUID, UUID, BOOLEAN)',
    'update_task_text(UUID, UUID, UUID, TEXT)',
    'get_service_tasks(UUID, UUID)',
    'copy_tasks_to_cycle(UUID, UUID, UUID)',
    'reset_service_to_not_ready(UUID, UUID)',
    'set_service_ready_flexible(UUID, UUID)',
    'transition_service_state(UUID, UUID, TEXT)',
    'complete_active_cycle()',
    'reactivate_cycle(UUID)',
    'get_cycle_completion_stats()',
    'get_valid_transitions(UUID, UUID)',
    'reset_service_to_triggered(UUID, UUID)',
    'trg_sd_denormalise_user()',
    'update_updated_at_column()'
  ];
BEGIN
  FOREACH func_signature IN ARRAY functions_to_fix
  LOOP
    BEGIN
      -- Set search_path to include public, extensions, pg_catalog, and pg_temp
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public, extensions, pg_catalog, pg_temp', func_signature);
      RAISE NOTICE 'Fixed search_path for function: %', func_signature;
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'Function does not exist (skipping): %', func_signature;
      WHEN others THEN
        RAISE NOTICE 'Error fixing function % - %: %', func_signature, SQLSTATE, SQLERRM;
    END;
  END LOOP;
END $$;
