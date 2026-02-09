import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function getTableDDL(client, tableName) {
    const cols = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1;
    `, [tableName]);

    let ddl = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
    const colDefs = cols.rows.map(col => {
        let type = col.data_type;
        if (col.character_maximum_length) {
            type += `(${col.character_maximum_length})`;
        }
        let def = `  "${col.column_name}" ${type}`;
        if (col.is_nullable === 'NO') {
            def += ' NOT NULL';
        }
        if (col.column_default) {
            def += ` DEFAULT ${col.column_default}`;
        }
        return def;
    });

    const pkRes = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1;
    `, [tableName]);

    if (pkRes.rows.length > 0) {
        const pks = pkRes.rows.map(r => `"${r.column_name}"`).join(', ');
        colDefs.push(`  PRIMARY KEY (${pks})`);
    }

    ddl += colDefs.join(',\n');
    ddl += '\n);';
    return ddl;
}

async function inspectSchema(connectionString, label) {
    if (!connectionString) {
        console.error(`Error: Connection string for ${label} is missing.`);
        return;
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        `);

        if (res.rows.length === 0) {
            console.log(`[]`);
        } else {
            const tables = res.rows.map(row => row.table_name);
            const allDDLs = [];
            for (const table of tables) {
                const ddl = await getTableDDL(client, table);
                // Also get row count for verification
                let count = 0;
                try {
                    const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
                    count = parseInt(countRes.rows[0].count, 10);
                } catch (e) { }

                allDDLs.push({ table, ddl, count });
            }
            fs.writeFileSync('ddl.json', JSON.stringify(allDDLs, null, 2));
            console.log('DDL written to ddl.json');
        }

    } catch (err) {
        console.error(`Error connecting to ${label}:`, err.message);
    } finally {
        await client.end();
    }
}

async function main() {
    await inspectSchema(process.env.SOURCE_DB_URL, 'SOURCE');
}

main();
