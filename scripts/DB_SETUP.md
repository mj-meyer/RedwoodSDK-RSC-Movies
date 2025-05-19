# Database Import Guide

This guide explains how to import the SQLite database into Cloudflare D1 for local development and production.

## Prerequisites

- Node.js installed
- Wrangler CLI installed
- SQLite3 command-line tool installed

## Setup Process

### 1. First-time Setup

If you're starting from scratch with the project and database.sqlite file:

```bash
# Export the schema to create migration files
npm run db:export:schema

# Export the data to generate seed files
npm run db:export:data

# Interactive tool to manage migrations and seeding
npm run db:init
```

### 2. For Team Members

If you're joining the project with the migration and seed files already committed:

```bash
# Apply migrations to local D1
npm run db:migrate:local

# Seed the local database with data
npm run db:seed:local
```

### 3. For Production Deployment

When you're ready to deploy to production:

```bash
# Apply migrations to production D1
npm run db:migrate:prod

# Seed the production database (only needed once)
npm run db:seed:prod
```

## Troubleshooting

### Large Database Import Issues

If you encounter issues with the database import due to file size:

1. Try running the import in smaller chunks by modifying the `MAX_CHUNK_SIZE` in `scripts/export-seed-data.js`
2. Run the import with the interactive tool: `npm run db:init`

### Foreign Key Errors

The import scripts use `PRAGMA defer_foreign_keys = true` to handle foreign key constraints. If you still encounter errors:

1. Check that tables are being imported in the correct order (defined in `TABLES` array in `scripts/export-seed-data.js`)
2. Make sure the schema migration completed successfully

## File Structure

- `migrations/0001_initial_schema.sql` - Database schema for D1
- `scripts/seed.sql` - Combined seed data for D1
- `scripts/seed-chunks/` - Individual chunks for each table (not committed)
- `scripts/export-schema.js` - Script to export schema from SQLite
- `scripts/export-seed-data.js` - Script to export data from SQLite
- `scripts/import-to-d1.js` - Interactive tool for database management 