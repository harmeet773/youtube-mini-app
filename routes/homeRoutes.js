const axios = require("axios");
const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { runSql } = require("../config/db");
const homeController = require('../controllers/homeController');       

// -------------------- Existing Routes --------------------

// Home page
router.get('/', homeController.index );

  

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
    res.redirect("/");
  }
);

router.get("/about", homeController.about);
router.post("/delete-comment", homeController.deleteComment);
router.post("/edit-comment", homeController.editComment);
router.post("/add-comment", homeController.addComment);

module.exports = router;
