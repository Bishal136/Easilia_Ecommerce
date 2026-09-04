import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import connectDB from '../src/config/db.js';

// Resolve directory paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env in server or root)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

/**
 * Parse CLI arguments into an options object
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    } else if (arg === '-e' || arg === '--email') {
      options.email = args[++i];
    } else if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
    } else if (arg === '-p' || arg === '--password') {
      options.password = args[++i];
    } else if (arg.startsWith('--name=')) {
      options.name = arg.split('=')[1];
    } else if (arg === '-n' || arg === '--name') {
      options.name = args[++i];
    } else if (arg.startsWith('--phone=')) {
      options.phone = arg.split('=')[1];
    } else if (arg === '--phone') {
      options.phone = args[++i];
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  // Support positional arguments: [email] [password] [name] [phone]
  if (!options.email && positional[0]) options.email = positional[0];
  if (!options.password && positional[1]) options.password = positional[1];
  if (!options.name && positional[2]) options.name = positional[2];
  if (!options.phone && positional[3]) options.phone = positional[3];

  return options;
};

/**
 * Display help/usage instructions
 */
const printHelp = () => {
  console.log(`
Nerob Ecommerce - Admin Seeder Script
======================================
Usage:
  node scripts/seedAdmin.js [options]
  node scripts/seedAdmin.js [email] [password] [name] [phone]

Options:
  -e, --email <email>        Admin email (default: env ADMIN_EMAIL or admin@nerob.com)
  -p, --password <password>  Admin password (min 6 chars, default: env ADMIN_PASSWORD or Admin@123456)
  -n, --name <name>          Admin full name (default: env ADMIN_NAME or Super Admin)
      --phone <phone>        Admin phone number (default: env ADMIN_PHONE or 01700000000)
  -f, --force                Force update password and fields if admin already exists
  -h, --help                 Display this help message

Examples:
  node scripts/seedAdmin.js
  node scripts/seedAdmin.js -e boss@nerob.com -p SecretPass123 -n "Nerob Boss"
  node scripts/seedAdmin.js custom@admin.com pass123456 "Custom Admin" 01800000000
  npm run seed:admin
`);
};

/**
 * Seed or update an Admin user in MongoDB
 */
const seedAdmin = async () => {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const adminEmail = (
    options.email ||
    process.env.ADMIN_EMAIL
  ).trim().toLowerCase();

  const adminPassword = (
    options.password ||
    process.env.ADMIN_PASSWORD
  ).trim();

  const adminName = (
    options.name ||
    process.env.ADMIN_NAME ||
    'Super Admin'
  ).trim();

  const adminPhone = (
    options.phone ||
    process.env.ADMIN_PHONE
  ).trim();

  // Validate inputs
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(adminEmail)) {
    console.error(`❌ [SEED ERROR] Invalid email format: "${adminEmail}"`);
    process.exit(1);
  }

  if (adminPassword.length < 6) {
    console.error('❌ [SEED ERROR] Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    console.log('-----------------------------------------');
    console.log('🌱 Starting Admin Seed Process...');
    console.log('-----------------------------------------');

    // Connect to database
    await connectDB();

    // Check if user already exists
    let existingUser = await User.findOne({ email: adminEmail }).select('+password');

    let adminUser;

    if (existingUser) {
      console.log(`🔍 Found existing user with email: ${adminEmail}`);

      let wasUpdated = false;

      // Promote to admin if not already
      if (existingUser.role !== 'admin') {
        console.log(`🔄 Promoting role from "${existingUser.role}" to "admin"...`);
        existingUser.role = 'admin';
        wasUpdated = true;
      }

      // Ensure verified and active
      if (!existingUser.isVerified) {
        existingUser.isVerified = true;
        wasUpdated = true;
      }

      if (existingUser.isBanned) {
        existingUser.isBanned = false;
        wasUpdated = true;
      }

      // Update password if --force or password explicitly passed
      if (options.force || options.password) {
        console.log('🔑 Updating admin password...');
        existingUser.password = adminPassword; // Pre-save hook will hash it with bcrypt
        wasUpdated = true;
      }

      // Update name if explicitly provided
      if (options.name && existingUser.name !== adminName) {
        existingUser.name = adminName;
        wasUpdated = true;
      }

      // Update phone if explicitly provided
      if (options.phone && existingUser.phone !== adminPhone) {
        existingUser.phone = adminPhone;
        wasUpdated = true;
      }

      if (wasUpdated) {
        await existingUser.save();
        console.log('✅ Admin user updated successfully.');
      } else {
        console.log('ℹ️  User is already an active verified Admin. (Use --force to reset password).');
      }

      adminUser = existingUser;
    } else {
      // Create new Admin user
      console.log(`✨ Creating new Admin user with email: ${adminEmail}...`);
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Pre-save hook will automatically hash with bcrypt
        role: 'admin',
        phone: adminPhone,
        isVerified: true,
        isBanned: false,
        authProvider: 'local',
      });

      console.log('✅ Admin user created successfully.');
    }

    // Display summary
    console.log('\n=========================================');
    console.log('👑 Admin Account Credentials');
    console.log('=========================================');
    console.log(`👤 Name:     ${adminUser.name}`);
    console.log(`📧 Email:    ${adminUser.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🛡️  Role:     ${adminUser.role}`);
    console.log(`📱 Phone:    ${adminUser.phone || 'N/A'}`);
    console.log(`✅ Verified: ${adminUser.isVerified}`);
    console.log(`🚫 Banned:   ${adminUser.isBanned}`);
    console.log(`🆔 ID:       ${adminUser._id}`);
    console.log('=========================================');
    console.log('🚀 You can now login at /api/v1/auth/login or via the Frontend Admin Portal.\n');

  } catch (error) {
    console.error('❌ [SEED ERROR] Failed to seed admin user:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  } finally {
    // Close MongoDB connection gracefully
    await mongoose.connection.close();
    console.log('[DATABASE] MongoDB connection closed.');
  }
};

// Execute seeding if run directly
seedAdmin();

export default seedAdmin;
