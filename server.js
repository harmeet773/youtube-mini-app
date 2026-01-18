import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import homeRoutes from './routes/homeRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';
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

console.log("allowed origins are ",allowedOrigins);
// allowedOrigins is an an array 
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // only if you use cookies/auth headers
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
// Content Security Policy
// =============================
// need to documention of below lines.
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:10000");
  next();
});

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