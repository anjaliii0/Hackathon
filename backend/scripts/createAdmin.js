/*
 * Create (or reset) the platform admin account.
 *
 * There is intentionally NO admin signup route — admins are provisioned
 * only through this script.
 *
 * Usage:
 *   node scripts/createAdmin.js                          # uses .env values
 *   node scripts/createAdmin.js <email> <password> [name]
 *
 * .env fallbacks:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 *
 * If a user with that email already exists, their password is reset and
 * the account is promoted to admin.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const email    = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;
  const name     = process.argv[4] || process.env.ADMIN_NAME || 'Platform Admin';

  if (!email || !password) {
    console.error('❌ Provide an email and password (args or ADMIN_EMAIL / ADMIN_PASSWORD in .env)');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      user.password = password;      // re-hashed by the pre-save hook
      user.isVerified = true;
      user.isBanned = false;
      await user.save();
      console.log(`♻️  Existing user promoted to admin & password reset: ${email}`);
    } else {
      user = await User.create({
        name,
        email,
        password,                    // hashed by the pre-save hook
        role: 'admin',
        isVerified: true,
      });
      console.log(`✅ Admin created: ${email}`);
    }

    console.log('   Name :', user.name);
    console.log('   Role :', user.role);
    console.log('\nLog in at /login with these credentials.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
})();
