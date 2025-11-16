const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { runSql } = require("../config/db");
const homeController = require('../controllers/homeController');

// Routes
router.get('/', homeController.index);

router.get("/register", (req, res) => {
  res.send("Register form here");
});

// Register user
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  await runSql(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashed]
  );

  res.send("User registered");
});

// Login page
router.get("/login", (req, res) => {
  res.send("Login form here");
});

// Login user
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  })
);

// Protected route
router.get("/dashboard", ensureAuth, (req, res) => {
  res.send("Welcome, " + req.user.username);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/login");
  });
});

// Middleware to check login
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

//router.get('/users', homeController.users);






module.exports = router;
