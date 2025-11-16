require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

require("./config/passport");      // <-- loads our raw SQL passport config
require("./config/initTables");    // <-- creates MySQL tables from code

const app = express();

// =============================
// Session middleware
// =============================
app.use(
  session({
    secret: "psupersecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// =============================
// Passport middleware
// =============================
app.use(passport.initialize());
app.use(passport.session());

// =============================
// Body parsers
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================
// Static assets
// =============================
app.use(express.static(path.join(__dirname, "public")));

// =============================
// View engine
// =============================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layout'); // looks in views/layout.ejs

// =============================
// Routes
// =============================
const homeRoutes = require("./routes/homeRoutes");


app.use("/", homeRoutes);


// =============================
// 404 handler
// =============================
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// =============================
// Start server
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
