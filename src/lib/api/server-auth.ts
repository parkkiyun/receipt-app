import { createSupabaseServerClient } from '../supabase/server';

export async function getCurrentUserOnServer() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
} 