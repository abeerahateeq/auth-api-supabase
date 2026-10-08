const { supabase } = require("./supabase");

// Pulls the token out of "Authorization: Bearer <token>".
// Returns null if the header is missing, malformed, or has no token.
function extractToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1] || null;
}

// Reusable guard: verifies the token with Supabase, then attaches req.user.
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    // Never trust getUser without checking BOTH the error and the user
    if (error || !data || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    // If we cannot verify the token, we must not let the request through
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth, extractToken };
