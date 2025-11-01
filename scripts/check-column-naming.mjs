#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);

console.log('\n🔍 CHECKING DATABASE COLUMN NAMING CONVENTIONS\n');
console.log('='.repeat(80));

async function checkColumnNaming() {
  try {
    // Get all tables and their columns
    const tables = await sql`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;

    // Group by table
    const tableMap = new Map();
    for (const row of tables) {
      if (!tableMap.has(row.table_name)) {
        tableMap.set(row.table_name, []);
      }
      tableMap.get(row.table_name).push({
        name: row.column_name,
        type: row.data_type,
      });
    }

    // Check for camelCase columns (columns with uppercase letters)
    const camelCaseColumns = [];
    const snakeCaseColumns = [];

    for (const [tableName, columns] of tableMap.entries()) {
      for (const column of columns) {
        // Check if column name contains uppercase letters
        if (/[A-Z]/.test(column.name)) {
          camelCaseColumns.push({
            table: tableName,
            column: column.name,
            type: column.type,
          });
        } else {
          snakeCaseColumns.push({
            table: tableName,
            column: column.name,
            type: column.type,
          });
        }
      }
    }

    console.log(`\n📊 COLUMN NAMING SUMMARY:\n`);
    console.log(`  Total tables: ${tableMap.size}`);
    console.log(`  Total columns: ${tables.length}`);
    console.log(`  CamelCase columns: ${camelCaseColumns.length}`);
    console.log(`  snake_case columns: ${snakeCaseColumns.length}`);

    if (camelCaseColumns.length > 0) {
      console.log('\n\n🔤 CAMELCASE COLUMNS TO RENAME:\n');
      console.log('='.repeat(80));

      // Group by table for easier reading
      const byTable = new Map();
      for (const col of camelCaseColumns) {
        if (!byTable.has(col.table)) {
          byTable.set(col.table, []);
        }
        byTable.get(col.table).push(col);
      }

      for (const [tableName, columns] of byTable.entries()) {
        console.log(`\n📋 Table: ${tableName}`);
        for (const col of columns) {
          // Convert camelCase to snake_case
          const snakeName = col.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          console.log(`  ${col.column.padEnd(30)} → ${snakeName.padEnd(30)} (${col.type})`);
        }
      }

      console.log('\n\n📝 MIGRATION SQL:\n');
      console.log('='.repeat(80));
      console.log('\n-- Rename camelCase columns to snake_case\n');

      for (const [tableName, columns] of byTable.entries()) {
        console.log(`-- Table: ${tableName}`);
        for (const col of columns) {
          const snakeName = col.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          console.log(`ALTER TABLE ${tableName} RENAME COLUMN ${col.column} TO ${snakeName};`);
        }
        console.log('');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkColumnNaming().catch(console.error);
