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

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { error: 'Demo mode' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) return { error: 'Demo mode' };
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/dashboard` },
  });
  return { error: error?.message ?? null };
}

export async function resetPassword(email: string) {
  if (!supabase) return { error: 'Demo mode' };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/dashboard`,
  });
  return { error: error?.message ?? null };
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
