#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MIGRATION_PATH = path.join(__dirname, '..', 'migrations', '0001_initial_schema.sql');
const SEED_PATH = path.join(__dirname, '..', 'scripts', 'seed.sql');
const DB_NAME = 'rsc_movies_rwsdk'; // From wrangler.jsonc

// Helper function to run commands with proper logging
function runCommand(command, description) {
  console.log(`\n🚀 ${description}...`);
  console.log(`Running: ${command}`);
  
  try {
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed: ${error.message}`);
    return false;
  }
}

// Function to check if files exist
function checkFilesExist() {
  if (!fs.existsSync(MIGRATION_PATH)) {
    console.error(`❌ Migration file not found: ${MIGRATION_PATH}`);
    console.log('Run "node scripts/export-schema.js" first to create it.');
    return false;
  }
  
  if (!fs.existsSync(SEED_PATH)) {
    console.error(`❌ Seed file not found: ${SEED_PATH}`);
    console.log('Run "node scripts/export-seed-data.js" first to create it.');
    return false;
  }
  
  return true;
}

// Function to apply migrations
async function applyMigrations(isRemote = false) {
  const flag = isRemote ? '--remote' : '--local';
  return runCommand(`npx wrangler d1 migrations apply ${DB_NAME} ${flag}`, 
                    `Applying migrations ${isRemote ? 'to production' : 'locally'}`);
}

// Function to apply seed data
async function applySeed(isRemote = false) {
  const flag = isRemote ? '--remote' : '--local';
  return runCommand(`npx wrangler d1 execute ${DB_NAME} ${flag} --file=${SEED_PATH}`,
                    `Applying seed data ${isRemote ? 'to production' : 'locally'}`);
}

// Ask for confirmation
function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${question} (y/n) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  console.log('🔄 D1 Database Import Tool');
  
  if (!checkFilesExist()) {
    process.exit(1);
  }
  
  // Check if migration files exist
  const migrationsExist = await runCommand(`npx wrangler d1 migrations list ${DB_NAME}`, 'Checking migrations');
  
  // Menu
  console.log('\n📋 Available Actions:');
  console.log('1. Apply migrations to local D1');
  console.log('2. Apply seed data to local D1');
  console.log('3. Apply migrations to production D1');
  console.log('4. Apply seed data to production D1');
  console.log('5. Exit');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Choose an action (1-5): ', async (answer) => {
    rl.close();
    
    switch(answer) {
      case '1':
        await applyMigrations(false);
        break;
      case '2':
        await applySeed(false);
        break;
      case '3':
        const confirmMigrations = await askForConfirmation('⚠️ Are you sure you want to apply migrations to production?');
        if (confirmMigrations) {
          await applyMigrations(true);
        } else {
          console.log('Production migrations cancelled.');
        }
        break;
      case '4':
        const confirmSeed = await askForConfirmation('⚠️ Are you sure you want to apply seed data to production?');
        if (confirmSeed) {
          await applySeed(true);
        } else {
          console.log('Production seeding cancelled.');
        }
        break;
      case '5':
        console.log('Exiting...');
        break;
      default:
        console.log('Invalid choice. Exiting...');
    }
  });
}

main(); 