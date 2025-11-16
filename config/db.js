// db.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

async function runSql(sql, params = []) {
  try {
    const [result] = await sequelize.query(sql, {
      replacements: params,
    });
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err };
  }
}

sequelize
  .authenticate()
  .then(() => console.log("Database connection successful"))
  .catch((err) => console.error("DB error:", err));

module.exports = { sequelize, runSql };
