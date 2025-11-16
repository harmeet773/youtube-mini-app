const { runSql } = require("./db");
(async () => {
  const response = await runSql(
    `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
    )`
  );

  if (response.success) console.log("Table created OK");
  else console.log("Table creation FAILED", response.error);
})();
