import { runSql } from './db.js';

(async () => {
  const response = await runSql(
    `CREATE TABLE IF NOT EXISTS USERS (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NULL,
      password VARCHAR(255) NULL,
      google_id VARCHAR(255) UNIQUE,
      email VARCHAR(255),

      given_name VARCHAR(255) NULL,
      family_name VARCHAR(255) NULL,
      picture TEXT NULL,

      access_token TEXT,         
      refresh_token TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );

  if (response.success) console.log("Table created OK");
  else console.log("Table creation FAILED", response.error);
})();
