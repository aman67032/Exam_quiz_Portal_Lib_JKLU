import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config();

async function getEnums(client) {
    const res = await client.query(`
        SELECT t.typname, e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public';
    `);

    const enums = {};
    res.rows.forEach(row => {
        if (!enums[row.typname]) {
            enums[row.typname] = [];
        }
        enums[row.typname].push(row.enumlabel);
    });

    console.log(JSON.stringify(enums, null, 2));
}

async function main() {
    const client = new Client({
        connectionString: process.env.SOURCE_DB_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    await getEnums(client);
    await client.end();
}

main();
