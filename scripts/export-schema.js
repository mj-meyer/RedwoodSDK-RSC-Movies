#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const SCHEMA_PATH = path.join(__dirname, '..', 'migrations', '0001_initial_schema.sql');

console.log('Exporting schema from SQLite database...');

// Generate schema SQL (tables, indexes, triggers, but no data)
try {
  // Get the schema without data
  const schemaCommand = `sqlite3 "${DB_PATH}" ".schema"`;
  const schemaSQL = execSync(schemaCommand).toString();
  
  // Remove SQLite internal tables and cleanup schema for D1
  const cleanedSchema = schemaSQL
    // Remove the sqlite_sequence table
    .replace(/CREATE TABLE sqlite_sequence[^;]+;/g, '')
    // Remove internal FTS table declarations and just keep the main FTS declaration
    .replace(/(CREATE VIRTUAL TABLE \w+ USING fts5[^;]+);[\s\S]*?(CREATE TABLE IF NOT EXISTS)/g, '$1;\n\n$2')
    // Remove comments that might confuse D1
    .replace(/\/\*[^*]*\*\//g, '')
    // Clean up any remaining SQLite-specific syntax
    .replace(/WITHOUT ROWID/g, '')
    // Fix PRIMARY KEY AUTOINCREMENT syntax for consistency
    .replace(/PRIMARY KEY\("id" AUTOINCREMENT\)/g, 'PRIMARY KEY AUTOINCREMENT')
    // Remove any double newlines created by our replacements
    .replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Add pragma statements for foreign keys
  const finalSQL = `-- Schema migration from SQLite to D1
PRAGMA foreign_keys = OFF;

${cleanedSchema}

PRAGMA foreign_keys = ON;
`;

  // Write the schema to the migration file
  fs.writeFileSync(SCHEMA_PATH, finalSQL);
  console.log(`Schema exported to ${SCHEMA_PATH}`);
} catch (error) {
  console.error('Error exporting schema:', error.message);
  process.exit(1);
} 