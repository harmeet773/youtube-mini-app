import mongoose from 'mongoose';
import { USE_LOCAL_MONGODB, runSql } from '../config/db.js';

let User;

if (USE_LOCAL_MONGODB) {
  const userSchema = new mongoose.Schema({
    username: { type: String, default: null },
    password: { type: String, default: null },
    google_id: { type: String, unique: true, sparse: true },
    email: { type: String, default: null },
    given_name: { type: String, default: null },
    family_name: { type: String, default: null },
    picture: { type: String, default: null },
    access_token: { type: String, default: null },
    refresh_token: { type: String, default: null },
    updated_at: { type: Date, default: Date.now }
  }, {
    timestamps: { updatedAt: 'updated_at', createdAt: false }
  });

  // For compatibility with code that expects 'id' instead of '_id'
  userSchema.virtual('id').get(function() {
    return this._id.toHexString();
  });

  userSchema.set('toJSON', {
    virtuals: true
  });

  userSchema.set('toObject', {
    virtuals: true
  });

  User = mongoose.model('User', userSchema);
} else {
  // SQL User Model (Abstraction)
  User = {
    findOne: async (query) => {
      let sql = 'SELECT * FROM USERS WHERE ';
      const conditions = [];
      const params = [];
      for (const key in query) {
        conditions.push(`${key} = ?`);
        params.push(query[key]);
      }
      sql += conditions.join(' AND ') + ' LIMIT 1';
      const response = await runSql(sql, params);
      if (response.success && response.result.length > 0) {
        const userData = response.result[0];
        const userObj = {
          ...userData,
          save: async function() {
            const updates = [];
            const updateParams = [];
            for (const k in this) {
              if (typeof this[k] !== 'function' && k !== 'id' && k !== '_id' && k !== 'created_at' && k !== 'updated_at') {
                updates.push(`${k} = ?`);
                updateParams.push(this[k]);
              }
            }
            updateParams.push(this.id);
            const updateSql = `UPDATE USERS SET ${updates.join(', ')} WHERE id = ?`;
            await runSql(updateSql, updateParams);
          }
        };
        return userObj;
      }
      return null;
    },
    findById: async (id) => {
      const sql = 'SELECT * FROM USERS WHERE id = ? LIMIT 1';
      const response = await runSql(sql, [id]);
      if (response.success && response.result.length > 0) {
        const userData = response.result[0];
        const userObj = {
          ...userData,
          save: async function() {
            const updates = [];
            const updateParams = [];
            for (const k in this) {
              if (typeof this[k] !== 'function' && k !== 'id' && k !== '_id' && k !== 'created_at' && k !== 'updated_at') {
                updates.push(`${k} = ?`);
                updateParams.push(this[k]);
              }
            }
            updateParams.push(this.id);
            const updateSql = `UPDATE USERS SET ${updates.join(', ')} WHERE id = ?`;
            await runSql(updateSql, updateParams);
          }
        };
        return userObj;
      }
      return null;
    },
    countDocuments: async () => {
      const sql = 'SELECT COUNT(*) as count FROM USERS';
      const response = await runSql(sql);
      return response.success ? response.result[0].count : 0;
    },
    // Adding a basic constructor-like function for SQL
    create: async (data) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO USERS (${keys.join(', ')}) VALUES (${placeholders})`;
        const response = await runSql(sql, values);
        if (response.success) {
            return { ...data, id: response.result.insertId };
        }
        throw new Error("Failed to create user in SQL");
    }
  };

  // To support `new User(...)` pattern used in passport.js
  const SQLUser = function(data) {
    Object.assign(this, data);
  };
  SQLUser.prototype.save = async function() {
    if (this.id) {
        const updates = [];
        const updateParams = [];
        for (const k in this) {
          if (typeof this[k] !== 'function' && k !== 'id' && k !== '_id' && k !== 'created_at' && k !== 'updated_at') {
            updates.push(`${k} = ?`);
            updateParams.push(this[k]);
          }
        }
        updateParams.push(this.id);
        const updateSql = `UPDATE USERS SET ${updates.join(', ')} WHERE id = ?`;
        await runSql(updateSql, updateParams);
    } else {
        const keys = [];
        const values = [];
        for (const k in this) {
          if (typeof this[k] !== 'function' && k !== 'id' && k !== '_id' && k !== 'created_at' && k !== 'updated_at') {
            keys.push(k);
            values.push(this[k]);
          }
        }
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO USERS (${keys.join(', ')}) VALUES (${placeholders})`;
        const response = await runSql(sql, values);
        if (response.success) {
            this.id = response.result.insertId;
        } else {
            throw new Error("Failed to save user in SQL: " + JSON.stringify(response.error));
        }
    }
  };
  SQLUser.findOne = User.findOne;
  SQLUser.findById = User.findById;
  SQLUser.countDocuments = User.countDocuments;
  User = SQLUser;
}

export default User;
