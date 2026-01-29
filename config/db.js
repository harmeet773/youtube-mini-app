// db.js
import 'dotenv/config';
import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import User from "../models/User.js";

// Sequelize is an ORM , it help to work with SQL databases.
// We need to provide dialect so that Sequelize knows with with DB we are working with so it can load necesarry drivers and interact with DB accordingly.

let sequelize;
let mongoConnected = false; // ✅ prevents multiple Mongo connections

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
      dialectOptions: {
        ssl: false // ✅ local SQL should NOT use SSL
      }
    }
  );
} else if (USE_REMOTE_SQL) {
  console.log("Connecting to remote SQL database");
  sequelize = new Sequelize(
    process.env.DB_NAME_REMOTE,
    process.env.DB_USER_REMOTE,
    process.env.DB_PASS_REMOTE,
    {
      host: process.env.DB_HOST_REMOTE,
      port: process.env.DB_PORT_REMOTE, // 🔴 TiDB Cloud fixed port
      dialect: process.env.DB_DIALECT_REMOTE,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: true,
          ca: process.env.DB_CA_CERT.replace(/\\n/g, "\n"),
        },
      },
      logging: false,
    }
  );
}


let connectDB = async () => {
  if (USE_LOCAL_MONGODB) {

    // ✅ Prevent multiple mongoose connections
    if (mongoConnected) {
      return mongoose.connection;
    }

    console.log("connecting to mongodb");
    try {
      const conn = await mongoose.connect(
        process.env.MONGODB_CONNECTION_STRING
      );

      mongoConnected = true;

      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(
        "MongoDB connection verified. User count:",
        await User.countDocuments()
      );

      return conn;
    } catch (error) {
      console.error(`Error: ${error.message}`);
      console.log(
        "MongoDB connection unsuccessful. Please make sure MongoDB is running."
      );
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
