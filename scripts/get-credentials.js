#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function getCredentials() {
  console.log('🚀 StravAwesome Credentials Setup\n');
  console.log('This script will help you get all the required API keys and database credentials.\n');

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Supabase Setup
  console.log('📊 SUPABASE SETUP');
  console.log('1. Go to https://supabase.com and create a new project');
  console.log('2. Go to Settings > Database and copy the connection string');
  console.log('3. Go to Settings > API and copy the URL and keys\n');

  const supabaseUrl = await question('Enter your Supabase URL (https://xxx.supabase.co): ');
  const supabaseAnonKey = await question('Enter your Supabase anon key: ');
  const supabaseServiceKey = await question('Enter your Supabase service role key: ');
  const databaseUrl = await question('Enter your database URL (postgresql://...): ');

  // Google OAuth Setup
  console.log('\n🔐 GOOGLE OAUTH SETUP');
  console.log('1. Go to https://console.cloud.google.com');
  console.log('2. Create a new project or select existing');
  console.log('3. Enable Google+ API');
  console.log('4. Go to Credentials > Create OAuth 2.0 Client ID');
  console.log('5. Add redirect URI: http://localhost:3000/api/auth/callback/google\n');

  const googleClientId = await question('Enter your Google Client ID: ');
  const googleClientSecret = await question('Enter your Google Client Secret: ');

  // Strava API Setup
  console.log('\n🏃 STRAVA API SETUP');
  console.log('1. Go to https://developers.strava.com');
  console.log('2. Click "Create & Manage Your App"');
  console.log('3. Fill in the form with your details');
  console.log('4. Set Authorization Callback Domain to: localhost\n');

  const stravaClientId = await question('Enter your Strava Client ID: ');
  const stravaClientSecret = await question('Enter your Strava Client Secret: ');

  // OpenAI Setup
  console.log('\n🤖 OPENAI SETUP');
  console.log('1. Go to https://platform.openai.com');
  console.log('2. Sign up or log in');
  console.log('3. Go to API Keys section');
  console.log('4. Create a new secret key\n');

  const openaiApiKey = await question('Enter your OpenAI API Key: ');

  // Update environment file
  envContent = envContent.replace('NEXT_PUBLIC_SUPABASE_URL=""', `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"`);
  envContent = envContent.replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=""', `NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey}"`);
  envContent = envContent.replace('SUPABASE_SERVICE_ROLE_KEY=""', `SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceKey}"`);
  envContent = envContent.replace('DATABASE_URL=""', `DATABASE_URL="${databaseUrl}"`);
  envContent = envContent.replace('POSTGRES_URL=""', `POSTGRES_URL="${databaseUrl}"`);
  envContent = envContent.replace('POSTGRES_URL_NON_POOLING=""', `POSTGRES_URL_NON_POOLING="${databaseUrl}"`);
  envContent = envContent.replace('GOOGLE_CLIENT_ID=""', `GOOGLE_CLIENT_ID="${googleClientId}"`);
  envContent = envContent.replace('GOOGLE_CLIENT_SECRET=""', `GOOGLE_CLIENT_SECRET="${googleClientSecret}"`);
  envContent = envContent.replace('STRAVA_CLIENT_ID=""', `STRAVA_CLIENT_ID="${stravaClientId}"`);
  envContent = envContent.replace('STRAVA_CLIENT_SECRET=""', `STRAVA_CLIENT_SECRET="${stravaClientSecret}"`);
  envContent = envContent.replace('OPENAI_API_KEY=""', `OPENAI_API_KEY="${openaiApiKey}"`);

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment variables updated!');
  console.log('\n🔧 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npx prisma generate');
  console.log('3. Run: npx prisma db push');
  console.log('4. Run: npm run dev');

  rl.close();
}

getCredentials().catch(console.error);