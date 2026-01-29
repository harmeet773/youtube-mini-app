import mongoose from 'mongoose';

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

const User = mongoose.model('User', userSchema);

export default User;
