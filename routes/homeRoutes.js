import axios from "axios";
import express from 'express';
import bcrypt from "bcryptjs";
import passport from "passport";
import { runSql } from "../config/db.js";
import homeController from '../controllers/homeController.js';       
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {getDynamicCallbackURL} from '../config/passport.js';
const router = express.Router();

// -------------------- STATE ENCRYPTION SETUP --------------------

const STATE_SECRET = process.env.STATE_SECRET || "STATE_ENCRYPTION_SECRET_32";
const ALGORITHM = "aes-256-gcm";

// Allowed frontend origins (security)
const ALLOWED_FRONTENDS = [
  "http://localhost:5173",
  // "https://yourdomain.com"
];

// Encrypt OAuth state
function encryptState(data) {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(STATE_SECRET).digest();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");

  return Buffer.from(
    JSON.stringify({
      iv: iv.toString("base64"),
      tag,
      encrypted,
    })
  ).toString("base64");
}

// Decrypt OAuth state
function decryptState(state) {
  const key = crypto.createHash("sha256").update(STATE_SECRET).digest();
  const decoded = JSON.parse(Buffer.from(state, "base64").toString());

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(decoded.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(decoded.tag, "base64"));

  let decrypted = decipher.update(decoded.encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

// -------------------- Existing Routes --------------------

// Home page
router.get('/', homeController.index );

router.get('/serverStatus', homeController.serverStatus );
  

router.post("/reply-comment", homeController.addReply );



// Protected route
//router.get("/dashboard", ensureAuth, homeController.index );

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/login");
  });
});

// Middleware to check login
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// -------------------- GOOGLE AUTH ROUTES --------------------

// Redirect to Google for authentication
router.get("/auth/google", (req, res, next) => {
  const origin = req.headers.origin;
  console.log("on /auth/google page");

  // Validate frontend origin
  const frontend =
    ALLOWED_FRONTENDS.includes(origin)
      ? origin
      : "http://localhost:5173";

  // Dynamically build callback URL using query params method
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  const callbackURL = `${protocol}://${host}/auth/google/callback`;

  // Encrypt frontend info inside OAuth state
  const state = encryptState({
    redirect: frontend,
    ts: Date.now(), // timestamp for additional safety
  });

  console.log("on /auth/google page   , before opening popup");

  passport.authenticate("google", {
    scope: [
      "email",  // gives email address and Verified/unverified status
      "profile", // gives you Name, Profile picture ,Google ID
      // it is Highest-level YouTube permission, 
      "https://www.googleapis.com/auth/youtube.force-ssl", // Post comments ,  Delete comments , Manage comment threads , View private YouTube data
      //"https://www.googleapis.com/auth/youtube" //  View YouTube account , View videos , View playlists ,iew subscriptions (if allowed)
    ],
    accessType: "offline",
    prompt: "consent",
    state,
    callbackURL: getDynamicCallbackURL(req),
  })(req, res, next);
});

router.get(
  "/auth/google/callback",
  (req, res, next) => {
    const callbackURL = getDynamicCallbackURL(req);
    passport.authenticate("google", { failureRedirect: "/login", callbackURL })(req, res, next);
  },
  (req, res) => {
    try {
      console.log("here on the /auth/google/callback page 1");   

      // Decrypt OAuth state
      const stateData = decryptState(req.query.state);
      console.log("this is stateData", stateData);

      // Validate frontend again (anti open-redirect)
      const frontend =
        ALLOWED_FRONTENDS.includes(stateData.redirect)
          ? stateData.redirect
          : "http://localhost:5173";

      // Create your own JWT
      const token = jwt.sign(req.user, "JWT_SECRET", {
        expiresIn: "1d",
      });
   
      console.log(
        "here on the /auth/google/callback 2 , frontend is ",
        frontend
      );

      // Redirect back to frontend with token
      res.redirect(
        `${frontend}/oauth-success?token=${token}`
      );

      console.log(
        "here on the /auth/google/callback   ,after redirecting to frontend"
      );
    } catch (err) {
      console.error("Invalid or tampered OAuth state", err);
      
      res.redirect(`${frontend}`);
    }
  }
);

router.get("/about", homeController.about);
router.post("/delete-comment", homeController.deleteComment);
router.post("/edit-comment", homeController.editComment);
router.post("/add-comment", homeController.addComment);

// Middleware to check for token in requests and authenticate user via passport.js if token is present
router.use((req, res, next) => {
  const token = req.headers['authorization'];
  if (token) {
    console.log('Frontend is sending token , deel');         

    try {
    passport.authenticate('jwt', { session: false })(req, res, next);
    } catch (err) {
      console.error("JWT Authentication Error:", err);
      res.status(401).json({ error: "Invalid token" });
    }
  } else {
    next();
  }
});

export default router;
