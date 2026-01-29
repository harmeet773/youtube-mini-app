// db.js
import 'dotenv/config';
import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';

// Sequelize is an ORM , it help to work with SQL databases.
// We need to provide dialect so that Sequelize knows with with DB we are working with so it can load necesarry drivers and interact with DB accordingly.

let sequelize;
const USE_LOCAL_SQL = process.env.USE_LOCAL_SQL === "true";
const USE_REMOTE_SQL = process.env.USE_REMOTE_SQL === "true";
const USE_LOCAL_MONGODB = process.env.USE_LOCAL_MONGODB === "true";

if (USE_LOCAL_SQL) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT,
      port: process.env.DB_PORT,
    }
  );
} else if (USE_REMOTE_SQL) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: process.env.DB_DIALECT,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: true,
          ca: process.env.DB_CA_CERT,
        },
      },
      logging: false,
    }
  );
}

let connectDB = async () => {
  if (USE_LOCAL_MONGODB) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
};

async function runSql(sql, params = []) {
  if (!sequelize) {
    return { success: false, error: "SQL connection not initialized" };
  }
  try {
    const [result] = await sequelize.query(sql, {
      replacements: params,
    });
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err };
  }
}

if (sequelize) {
  sequelize
    .authenticate()
    .then(() => console.log("SQL Database connection successful"))
    .catch((err) => console.error("SQL DB error:", err));
}

export { sequelize, runSql, USE_LOCAL_SQL, USE_REMOTE_SQL, USE_LOCAL_MONGODB };
export default connectDB;