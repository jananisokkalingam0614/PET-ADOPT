const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  phone:     { type: String, default: '' },
  address:   { street: String, city: String, state: String, zip: String },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
