// This file provides type declarations for Deno and remote modules
// to satisfy the local TypeScript compiler for Supabase Edge Functions.

declare module "https://deno.land/std@0.190.0/http/server.ts" {
  // Note: This is a simplified declaration. For full types, consider a Deno-native setup.
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): Promise<void>;
}

// This tells TypeScript that the remote module has the same types as the installed npm package.
// This is for local development only. The Deno runtime will fetch the actual module from the URL.
declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export * from "@supabase/supabase-js";
}

declare module "https://deno.land/x/xhr@0.1.0/mod.ts" {
  // This module is a polyfill and doesn't export anything.
}