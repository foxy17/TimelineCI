/*
  # Fix Trigger Function User Metadata Column Error

  The trigger function trg_sd_denormalise_user() is trying to access
  a column called 'user_metadata' that doesn't exist in auth.users.
  The correct column name is 'raw_user_meta_data'.

  This migration fixes the trigger function to use the correct column name.
*/

-- Fix the trigger function to use the correct column name
CREATE OR REPLACE FUNCTION public.trg_sd_denormalise_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run only when updated_by changes OR on initial insert
  IF TG_OP = 'INSERT' OR NEW.updated_by IS DISTINCT FROM OLD.updated_by THEN
    SELECT  email,
            COALESCE(
              raw_user_meta_data ->> 'full_name',
              -- Remove the non-existent user_metadata column reference
              split_part(email,'@',1)
            )
    INTO    NEW.updated_by_email,
            NEW.updated_by_name
    FROM    auth.users
    WHERE   id = NEW.updated_by;
  END IF;

  RETURN NEW;
END;
$$; 