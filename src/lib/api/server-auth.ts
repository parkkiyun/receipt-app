import { createSupabaseServerClient } from '../supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export async function getCurrentUserOnServer() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUser(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
} 