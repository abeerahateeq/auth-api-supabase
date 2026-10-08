const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY. Copy .env.example to .env and fill them in.");
  process.exit(1);
}

// The server holds no user sessions: every request carries its own token.
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

module.exports = { supabase, SUPABASE_URL, SUPABASE_KEY };
