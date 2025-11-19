const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const { runSql } = require("./db");




// ------------------- LOCAL STRATEGY -------------------
/* passport.use(
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
*/
// ------------------- GOOGLE STRATEGY -------------------

function getDynamicCallbackURL(req) {
  const host = req.get("host");

  // If the domain includes "localhost" → use http
  if (host.includes("localhost")) {
    return `http://${host}/auth/google/callback`;
  }

  // Otherwise → force https for production
  return `https://${host}/auth/google/callback`;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      // placeholder — real URL made dynamically on each request
      callbackURL: "/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Generate the callback URL dynamically
        const callbackURL = getDynamicCallbackURL(req);
        console.log("Dynamic Callback URL →", callbackURL);

        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || null;

        // Check user
        const existing = await runSql(
          "SELECT * FROM users WHERE google_id = ?",
          [googleId]
        );

        if (existing.result.length > 0) {
          await runSql(
            "UPDATE users SET access_token = ?, refresh_token = ? WHERE google_id = ?",
            [accessToken, refreshToken, googleId]
          );
          return done(null, existing.result[0]);
        }

        // Insert new user
        await runSql(
          "INSERT INTO users (username, google_id, access_token, refresh_token) VALUES (?, ?, ?, ?)",
          [email, googleId, accessToken, refreshToken]
        );

        const created = await runSql(
          "SELECT * FROM users WHERE google_id = ?",
          [googleId]
        );

        if (!created.result.length) {
          return done(new Error("User insert failed"));
        }

        return done(null, created.result[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);
// ------------------- SESSION HANDLING -------------------

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const data = await runSql("SELECT * FROM users WHERE id = ?", [id]);
    const rows = data.result || [];
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
