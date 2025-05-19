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
const SEED_DIR = path.join(__dirname, '..', 'scripts', 'seed-chunks');
const MAX_CHUNK_SIZE = 5000; // Maximum number of rows per chunk

// Create the seed directory if it doesn't exist
if (!fs.existsSync(SEED_DIR)) {
  fs.mkdirSync(SEED_DIR, { recursive: true });
}

// Tables to export and their correct import order
const TABLES = [
  'genres',
  'cast_members',
  'movies',
  'movie_genres',
  'movie_cast',
  'favorites',
  // Not exporting FTS tables as they'll be regenerated
];

console.log('Exporting seed data from SQLite database...');

// Helper to create SQL export with pagination
function exportTableData(table, outputPath, chunkSize = MAX_CHUNK_SIZE) {
  console.log(`Exporting ${table}...`);
  
  // Get the total count
  const countCommand = `sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM ${table}"`;
  const count = parseInt(execSync(countCommand).toString().trim(), 10);
  
  if (count === 0) {
    console.log(`No data in table ${table}, skipping`);
    return;
  }
  
  // Calculate number of chunks
  const numChunks = Math.ceil(count / chunkSize);
  console.log(`Table ${table} has ${count} rows, splitting into ${numChunks} chunks`);
  
  for (let i = 0; i < numChunks; i++) {
    const offset = i * chunkSize;
    const limit = chunkSize;
    const chunkPath = `${outputPath}_${i + 1}.sql`;
    
    // Export this chunk as INSERT statements with explicit table name
    const exportCommand = `sqlite3 -quote "${DB_PATH}" ".mode insert" ".output ${chunkPath}" "SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}" | sed 's/INSERT INTO "table"/INSERT INTO "${table}"/'`;
    
    try {
      // For SQLite versions that don't properly handle the sed command, use multiple steps
      const tempFile = `${chunkPath}.tmp`;
      execSync(`sqlite3 "${DB_PATH}" ".mode insert" ".output ${tempFile}" "SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}"`);
      execSync(`sed 's/INSERT INTO "table"/INSERT INTO "${table}"/g' ${tempFile} > ${chunkPath}`);
      fs.unlinkSync(tempFile);
    } catch (error) {
      console.error(`Error exporting chunk ${i+1} for table ${table}: ${error.message}`);
      // Try another approach with raw output and manual substitution
      const rawData = execSync(`sqlite3 "${DB_PATH}" "SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}"`).toString();
      const lines = rawData.split('\n').filter(line => line.trim().length > 0);
      
      const insertStatements = lines.map(line => {
        const values = line.split('|').map(val => {
          // Escape single quotes and wrap in quotes
          const escaped = val.replace(/'/g, "''");
          return `'${escaped}'`;
        }).join(',');
        return `INSERT INTO "${table}" VALUES(${values});`;
      });
      
      fs.writeFileSync(chunkPath, insertStatements.join('\n'));
    }
    
    console.log(`Exported chunk ${i + 1}/${numChunks} to ${chunkPath}`);
  }
}

// Export each table's data
for (const table of TABLES) {
  exportTableData(table, path.join(SEED_DIR, table));
}

// Create the master seed file that imports all chunks
const masterSeedPath = path.join(__dirname, '..', 'scripts', 'seed.sql');
let masterSeedContent = `-- Seed data for D1 database
PRAGMA defer_foreign_keys = true;

`;

// Add each table's chunks to the master seed file
for (const table of TABLES) {
  const tablePath = path.join(SEED_DIR, table);
  const pattern = `${table}_*.sql`;
  const chunks = fs.readdirSync(SEED_DIR)
    .filter(file => file.startsWith(`${table}_`) && file.endsWith('.sql'))
    .sort((a, b) => {
      const numA = parseInt(a.replace(`${table}_`, '').replace('.sql', ''), 10);
      const numB = parseInt(b.replace(`${table}_`, '').replace('.sql', ''), 10);
      return numA - numB;
    });
  
  if (chunks.length > 0) {
    masterSeedContent += `-- Table: ${table}\n`;
    for (const chunk of chunks) {
      masterSeedContent += `-- Including chunk: ${chunk}\n`;
      // Read the file content and fix any remaining "table" references
      let chunkContent = fs.readFileSync(path.join(SEED_DIR, chunk), 'utf8');
      chunkContent = chunkContent.replace(/INSERT INTO "table"/g, `INSERT INTO "${table}"`);
      masterSeedContent += chunkContent;
      masterSeedContent += '\n';
    }
    masterSeedContent += '\n';
  }
}

masterSeedContent += `
-- Rebuild FTS tables if needed
DELETE FROM fts_movies;
INSERT INTO fts_movies(rowid, title, extract)
SELECT id, title, extract FROM movies;

PRAGMA defer_foreign_keys = false;
`;

fs.writeFileSync(masterSeedPath, masterSeedContent);
console.log(`Created master seed file at ${masterSeedPath}`);

console.log('Export completed successfully!'); 