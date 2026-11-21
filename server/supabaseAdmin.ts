import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { envConfig, isSupabaseServerConfigured } from './config.ts';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) {
    return null;
  }
  if (!adminClient) {
    adminClient = createClient(envConfig.supabaseUrl, envConfig.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}
