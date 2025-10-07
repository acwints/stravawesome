#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up StravAwesome database...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Please follow the SETUP_GUIDE.md to configure your environment variables first.');
  process.exit(1);
}

// Check if DATABASE_URL is set
require('dotenv').config({ path: envPath });
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  console.log('Please add your Supabase database URL to .env.local');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\n🗄️  Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('\n✅ Database setup complete!');
  console.log('\n🎉 You can now run: npm run dev');
  
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
}