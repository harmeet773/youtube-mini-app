const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { runSql } = require("./db");

// LOCAL STRATEGY
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

// serialize → store user.id in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize → fetch user by id
passport.deserializeUser(async (id, done) => {
  try {
    const { result } = await runSql("SELECT * FROM users WHERE id = ?", [id]);
    done(null, result[0]);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
