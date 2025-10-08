// This file tells TypeScript how to handle the remote modules imported in Edge Functions.

// Declaration for Deno's standard library server.
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}

// Declaration for the Supabase client from esm.sh.
// It re-uses the types from the npm package you already have installed.
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

// Declaration for the XHR polyfill. It doesn't export anything.
declare module "https://deno.land/x/xhr@0.1.0/mod.ts" {}