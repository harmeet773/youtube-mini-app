import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import homeRoutes from './routes/homeRoutes.js';
import './config/passport.js';      // <-- loads our raw SQL passport config
import './config/initTables.js';    // <-- creates MySQL tables from code
import { fileURLToPath } from 'url';
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

// =============================   
// Session middleware
// =============================
// secret -  This is used to sign the session ID cookie. 
// resave: false - This means do not save the session to the session store if it wasn’t modified.
// saveUninitialized: false - This means do not create a session until something is stored in session.
app.use(
  session({
    secret: "psupersecretkey",
    resave: false,
    saveUninitialized: false,
  })
);


app.use(
  cors({
    origin: allowedOrigins,
  })
);

// =============================
// Passport middleware
// =============================
app.use(passport.initialize());
// here we are using passport sessions middleware. now passport will can create login sessions.
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
// Routes
// =============================
app.use("/", homeRoutes);
app.use("/youtube", youtubeRoutes);

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