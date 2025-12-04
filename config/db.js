// db.js
require("dotenv").config();
const { Sequelize } = require("sequelize");
// Sequelize is an ORM  , it help to work with  SQL databases .
//  We need to provide dialect so that Sequelize knows with with DB we are working with so it can load necesarry drivers  and interact with DB accordingly .

let sequelize;
if (process.env.Project_Host_Environment_Local === "true"){ sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
     port: process.env.DB_PORT,
  }   
);   
}else{
 sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,      // FIXED
    dialect: process.env.DB_DIALECT, // should be "mysql"

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: process.env.DB_CA_CERT,   // full ca.pem content as env var
      },
    },

    logging: false,
  }
);} 
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
