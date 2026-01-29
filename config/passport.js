import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import User from "../models/User.js";


// ------------------- LOCAL STRATEGY -------------------
/* passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });

      if (!user)
        return done(null, false, { message: "User not found" });

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
        let user = await User.findOne({ google_id: googleId });
        
        console.log("Google profile info: is below");
        console.log(profile);

        if (user) {
          user.access_token = accessToken;
          user.refresh_token = refreshToken;
          user.email = email;
          user.given_name = given_name;
          user.family_name = family_name;
          user.picture = picture;
          await user.save();
          return done(null, user);
        }

        // Insert new user
        user = new User({
          username: email,
          google_id: googleId,
          access_token: accessToken,
          refresh_token: refreshToken,
          email: email,
          given_name: given_name,
          family_name: family_name,
          picture: picture
        });
        await user.save();

        console.log("user should have been added to database");
        return done(null, user);
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
      const user = await User.findById(payload.id);
      
        console.log("inside jwt authentication strategy of passport.js ");
      if (!user) {
        // false → authentication fails → 401 Unauthorized
        return done(null, false);
      }
      
      console.log("inside jwt authentication strategy of passport.js ,following should be in req.user ", user);
      // below line assigns req.user = user;
      return done(null, user);
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
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
export {getDynamicCallbackURL};