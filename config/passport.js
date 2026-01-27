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
        "SELECT * FROM USERS WHERE username = ?",
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
        console.log("Google profile info:", JSON.stringify(profile));
        const googleId = profile.id;
        const email = profile._json.email || null;
        const given_name = profile._json.given_name || null;
        const family_name = profile._json.family_name || null;
        const picture = profile._json.picture || null;
  
              // Check if user exists
        const existing = await runSql(
          "SELECT * FROM USERS WHERE google_id = ?",
          [googleId]
        );
    console.log("Google profile info: is below");
    console.log(profile);
        if (existing.result.length > 0) {
          await runSql(
            "UPDATE USERS SET access_token = ?, refresh_token = ?, email = ?, given_name = ?, family_name = ?, picture = ? WHERE google_id = ?",
            [accessToken, refreshToken, email, given_name, family_name, picture, googleId]
          );
          return done(null, existing.result[0]);
        }

        // Insert new user
        await runSql(
          "INSERT INTO USERS (username, google_id, access_token, refresh_token, email, given_name, family_name, picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [email, googleId, accessToken, refreshToken, email, given_name, family_name, picture]
        );

        const created = await runSql(
          "SELECT * FROM USERS WHERE google_id = ?",
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
  // ExtractJwt.fromAuthHeaderAsBearerToken()
  //It extracts the JWT from this HTTP header named Authorization
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "JWT_SECRET",
};


passport.use(
  // this strategy triggers when below line is called 
  // passport.authenticate('jwt', { session: false })(req, res, next);
  new JwtStrategy(jwtOptions, 
    // payload is decoded JWT. JWT is already verified at this point and 
    async (payload, done) => {
    try {
      const { success, result } = await runSql(
        "SELECT * FROM USERS WHERE id = ?",
        [payload.id]
      );
        console.log("inside jwt authentication strategy of passport.js ");
      if (!success || result.length === 0) {
        // false → authentication fails → 401 Unauthorized
        return done(null, false);
      }
      
      console.log("inside jwt authentication strategy of passport.js ,following should be in req.user ", result[0]);
      // below line assigns req.user = result[0];
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
    const data = await runSql("SELECT * FROM USERS WHERE id = ?", [id]);
    const rows = data.result || [];
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

export default passport;
export {getDynamicCallbackURL};