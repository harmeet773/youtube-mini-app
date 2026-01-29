import connectDB, { USE_LOCAL_SQL, USE_REMOTE_SQL, USE_LOCAL_MONGODB } from "./db.js";
import User from "../models/User.js";
import { runSql } from "./db.js";

/* =======================
   MongoDB Initialization
======================= */
async function initMongoDB() {
  try {
    await connectDB();

    const count = await User.countDocuments();
    console.log("MongoDB connection verified. User count:", count);
  } catch (err) {
    console.error("MongoDB initialization failed:", err);
    process.exit(1);
  }
}

/* =======================
   SQL Initialization
======================= */
async function initSQL() {
  try {
    const response    = await runSql(`
      CREATE TABLE IF NOT EXISTS USERS (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        password VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255),

        given_name VARCHAR(255),
        family_name VARCHAR(255),
        picture TEXT,

        access_token TEXT,
        refresh_token TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    if (response.success) {
      console.log("SQL: USERS table created or already exists");
    } else {
      console.error("SQL table creation failed:", response.error);
    }
  } catch (err) {
    console.error("SQL initialization error:", err);
    process.exit(1);
  }
}

/* =======================
   Bootstrapping
======================= */
(async () => {
  if (USE_LOCAL_MONGODB) {
    await initMongoDB();
  } else if (USE_LOCAL_SQL || USE_REMOTE_SQL) {
    await initSQL();
  }
})();
