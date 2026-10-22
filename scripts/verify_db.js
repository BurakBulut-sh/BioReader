import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Mock paths
const docsPath = path.join(process.env.HOME || '.', 'Documents');
const dbPath = path.join(docsPath, 'BioReader', 'bioreader.sqlite3');

console.log(`[Verify] Checking database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
    console.error('[Error] Database file not found. Run the app once to create it.');
    process.exit(1);
}

const db = new Database(dbPath);

// Check if terms table has personal_note column
try {
    const tableInfo = db.pragma('table_info(terms)');
    const hasColumn = tableInfo.some(col => col.name === 'personal_note');

    if (hasColumn) {
        console.log('[Success] "personal_note" column exists in "terms" table.');
    } else {
        console.error('[Fail] "personal_note" column MISSING in "terms" table.');
    }
} catch (err) {
    console.error('[Error] Failed to check table info:', err);
}

db.close();
