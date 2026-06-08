const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    // role: student | college | company | admin
    role: {
      type: String,
      enum: ['student', 'college', 'company', 'admin'],
      default: 'student',
    },

    isVerified: { type: Boolean, default: false },
    isBanned:   { type: Boolean, default: false },

    // Admin suspension metadata
    suspendedReason: { type: String },
    suspendedAt:     { type: Date },

    // Activity tracking (powers "active users" analytics)
    lastActive: { type: Date },

    // Email verification (6-digit code)
    emailVerifyCode:   { type: String, select: false },
    emailVerifyExpire: { type: Date,   select: false },

    // Password reset
    resetPasswordToken:  { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
