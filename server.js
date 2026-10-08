require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapi = require("./openapi.json");
const { supabase, SUPABASE_URL, SUPABASE_KEY } = require("./supabase");
const { requireAuth } = require("./auth");

const app = express();
app.use(express.json());

// Swagger UI with the bearer "Authorize" padlock
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// ---------- Public ----------
app.get("/public/info", (req, res) => {
  res.json({ message: "Welcome stranger! This info is public." });
});

// ---------- Auth ----------
const missingFields = (body) =>
  !body || typeof body.email !== "string" || typeof body.password !== "string" ||
  body.email.trim() === "" || body.password === "";

app.post("/auth/signup", async (req, res) => {
  if (missingFields(req.body)) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email: req.body.email.trim(),
      password: req.body.password,
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  if (missingFields(req.body)) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: req.body.email.trim(),
      password: req.body.password,
    });
    if (error || !data || !data.session) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }
    res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout is protected: the guard runs first, then we end the session.
// The server keeps no session of its own, so we call Supabase's logout
// endpoint directly with the caller's token (this revokes their sessions).
app.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${req.token}` },
    });
    if (!response.ok) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------- Protected (all use the same middleware) ----------
app.get("/protected/profile", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at,
  });
});

app.get("/protected/dashboard", requireAuth, (req, res) => {
  res.json({ message: `Welcome back, ${req.user.email}!` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running and connected to Supabase on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
});
