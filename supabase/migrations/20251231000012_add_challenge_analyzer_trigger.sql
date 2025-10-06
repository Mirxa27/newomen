-- This script is intentionally left blank.
-- The trigger and function are now managed via Supabase's dashboard
-- to avoid SQL syntax issues with the linter.

-- The following SQL was used to create the trigger in the Supabase dashboard:

/*
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION trigger_challenge_analyzer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url:='https://fkikaozubngmzcrnhkqe.supabase.co/functions/v1/couples-challenge-analyzer',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNjc3NCwiZXhwIjoyMDcwNTkyNzc0fQ.xqeK5GZ8yCDzUGhC6YHkjGnumJqYF7lZ6A-5zsD1DNA'
    ),
    body:=jsonb_build_object('record', NEW)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_challenge_update
AFTER UPDATE OF responses ON public.couples_challenges
FOR EACH ROW
EXECUTE FUNCTION trigger_challenge_analyzer();
*/