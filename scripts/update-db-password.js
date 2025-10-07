#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function updateDatabasePassword() {
  console.log('🔐 Supabase Database Password Setup\n');
  console.log('Your Supabase project is configured with:');
  console.log('• Project URL: https://dfxqusmpmnftzcujiwfx.supabase.co');
  console.log('• Database Host: db.dfxqusmpmnftzcujiwfx.supabase.co');
  console.log('• API Keys: ✅ Configured\n');

  console.log('To get your database password:');
  console.log('1. Go to https://supabase.com/dashboard/project/dfxqusmpmnftzcujiwfx');
  console.log('2. Go to Settings → Database');
  console.log('3. Look for "Database password" or "Connection string"');
  console.log('4. Copy the password from the connection string\n');

  const password = await question('Enter your database password: ');

  if (!password) {
    console.log('❌ No password provided. Exiting.');
    rl.close();
    return;
  }

  // Update .env.local file
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  const databaseUrl = `postgresql://postgres:${password}@db.dfxqusmpmnftzcujiwfx.supabase.co:5432/postgres`;
  
  envContent = envContent.replace(
    'DATABASE_URL="postgresql://postgres:[PASSWORD]@db.dfxqusmpmnftzcujiwfx.supabase.co:5432/postgres"',
    `DATABASE_URL="${databaseUrl}"`
  );
  
  envContent = envContent.replace(
    'POSTGRES_URL="postgresql://postgres:[PASSWORD]@db.dfxqusmpmnftzcujiwfx.supabase.co:5432/postgres"',
    `POSTGRES_URL="${databaseUrl}"`
  );
  
  envContent = envContent.replace(
    'POSTGRES_URL_NON_POOLING="postgresql://postgres:[PASSWORD]@db.dfxqusmpmnftzcujiwfx.supabase.co:5432/postgres"',
    `POSTGRES_URL_NON_POOLING="${databaseUrl}"`
  );

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Database password updated!');
  console.log('\n🔧 Next steps:');
  console.log('1. Run: npx prisma generate');
  console.log('2. Run: npx prisma db push');
  console.log('3. Run: npm run dev');

  rl.close();
}

updateDatabasePassword().catch(console.error);