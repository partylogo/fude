const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  // Prefer service role key on server to allow writes; fallback to anon for read-only
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: { persistSession: false },
    });
  } catch (_e) {
    return null;
  }
}

module.exports = getSupabaseClient;

