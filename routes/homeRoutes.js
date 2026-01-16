import axios from "axios";
import express from 'express';
import bcrypt from "bcryptjs";
import passport from "passport";
import { runSql } from "../config/db.js";
import homeController from '../controllers/homeController.js';       
import crypto from "crypto";
import jwt from "jsonwebtoken";

const router = express.Router();

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
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "email",  // gives email address and Verified/unverified status
      "profile", // gives you Name, Profile picture ,Google ID
      // it is Highest-level YouTube permission, 
      "https://www.googleapis.com/auth/youtube.force-ssl", // Post comments ,  Delete comments , Manage comment threads , View private YouTube data
      //"https://www.googleapis.com/auth/youtube" //  View YouTube account , View videos , View playlists ,iew subscriptions (if allowed)
    ],
    accessType: "offline", 
    prompt: "consent"
  })  
);


   

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Create your own JWT
    const token = jwt.sign(req.user, "JWT_SECRET", {
      expiresIn: "1d",
    });

    // Redirect back to frontend with token
    res.redirect(
      `http://localhost:5173/oauth-success?token=${token}`
    );
  }
);


router.get("/about", homeController.about);
router.post("/delete-comment", homeController.deleteComment);
router.post("/edit-comment", homeController.editComment);
router.post("/add-comment", homeController.addComment);

export default router;