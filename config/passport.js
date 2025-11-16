const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const { runSql } = require("./db");

// ------------------- LOCAL STRATEGY -------------------
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { success, result } = await runSql(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      if (!success || result.length === 0)
        return done(null, false, { message: "User not found" });

      const user = result[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// ------------------- GOOGLE STRATEGY -------------------
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email", "https://www.googleapis.com/auth/youtube.force-ssl"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const { result } = await runSql(
          "SELECT * FROM users WHERE google_id = ?",
          [profile.id]
        );

        if (result.length > 0) {
          // Update tokens
          await runSql(
            "UPDATE users SET access_token = ?, refresh_token = ? WHERE google_id = ?",
            [accessToken, refreshToken, profile.id]
          );
          return done(null, result[0]);
        }

        // Insert new user
        const username = profile.emails[0].value;
        const { result: newUser } = await runSql(
          "INSERT INTO users (username, google_id, access_token, refresh_token) VALUES (?, ?, ?, ?)",
          [username, profile.id, accessToken, refreshToken]
        );

        const { result: createdUser } = await runSql(
          "SELECT * FROM users WHERE id = ?",
          [newUser.insertId]
        );

        return done(null, createdUser[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ------------------- SESSION -------------------
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const { result } = await runSql("SELECT * FROM users WHERE id = ?", [id]);
    done(null, result[0]);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
