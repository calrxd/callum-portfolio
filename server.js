import "dotenv/config";

import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import compression from "compression";

import { initDb } from "./src/db.js";
import { requireAuth, authRouter } from "./src/auth.js";
import { adminRouter } from "./src/routes/admin.js";
import { siteRouter } from "./src/routes/site.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  contentSecurityPolicy: false, // keep simple for now; tighten later
}));
app.use(compression());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// If deploying behind a reverse proxy (nginx/fly/vercel/etc), set TRUST_PROXY=1
if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const cookieSecure =
  process.env.COOKIE_SECURE === "1" || process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure,
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    maxAge: process.env.NODE_ENV === "production" ? "30d" : 0,
  })
);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    // uploaded files are content-addressed by random filename
    maxAge: process.env.NODE_ENV === "production" ? "365d" : 0,
    immutable: process.env.NODE_ENV === "production",
  })
);

initDb();

app.use("/auth", authRouter);

// Admin UI (password protected)
app.use("/admin", requireAuth, adminRouter);

// Site routes (optionally gated)
app.use("/", siteRouter);

const port = process.env.PORT || 3020;
app.listen(port, () => {
  console.log(`Portfolio running on http://localhost:${port}`);
});
