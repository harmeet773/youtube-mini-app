// db.js
import 'dotenv/config';
import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';

// Sequelize is an ORM  , it help to work with  SQL databases .
//  We need to provide dialect so that Sequelize knows with with DB we are working with so it can load necesarry drivers  and interact with DB accordingly .

let sequelize;
if (process.env.USE_LOCAL_SQL === "true"){ sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
     port: process.env.DB_PORT,
  }   
);   
}if(process.env.USE_REMOTE_MONGODB === "true"){
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
let connectDB;
if(process.env.USE_REMOTE_MONGODB === "true"){
     connectDB = async () => {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    };


}
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

export { sequelize, runSql ,  };
export default connectDB;