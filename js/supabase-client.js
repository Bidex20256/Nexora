/* NEXORA — shared Supabase client (authentication only).
   Requires @supabase/supabase-js v2 from the CDN to be loaded first.
   Only the publishable key belongs here: it is designed to be public.
   Never put a service-role or secret key in browser code. */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://ytyqhzsvkvioudqyewux.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_o8E2K6cUA-kVIcX5nzGH3w_sVXFzyNI';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    window.nexoraSupabase = null;
    console.warn('NEXORA: the Supabase library failed to load, so sign-in is unavailable.');
    return;
  }

  window.nexoraSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
})();
