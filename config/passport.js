import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import { runSql } from "./db.js";

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
      callbackURL: getDynamicCallbackURL, // Set dynamic callbackURL
      passReqToCallback: true, // ✅ IMPORTANT
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || null;

        // Check if user exists
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
        console.log("user should have been added to database");
        if (!created.result.length) return done(new Error("User insert failed"));

        return done(null, created.result[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ------------------- JWT STRATEGY -------------------

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "JWT_SECRET",
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const { success, result } = await runSql(
        "SELECT * FROM users WHERE id = ?",
        [payload.id]
      );

      if (!success || result.length === 0) {
        return done(null, false);
      }

      return done(null, result[0]);
    } catch (err) {
      return done(err, false);
    }
  })
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

export default passport;
export {getDynamicCallbackURL};