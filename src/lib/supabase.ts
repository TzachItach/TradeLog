import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const DEMO_MODE = !supabaseUrl || supabaseUrl === 'https://your-project.supabase.co';

export const supabase = DEMO_MODE
  ? null
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

export async function signInWithGoogle() {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
}

export async function signInWithApple() {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
