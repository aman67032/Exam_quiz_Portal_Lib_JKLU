import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config();

const ENUMS = {
    'papertype': ['OTHER', 'PROJECT', 'ASSIGNMENT', 'ENDTERM', 'MIDTERM', 'QUIZ'],
    'submissionstatus': ['REJECTED', 'APPROVED', 'PENDING']
};

// DDL with USER-DEFINED replaced by actual enum names
// Ordered by dependency (users first, then courses, then papers/others)
const TABLES_DDL = [
    {
        name: 'users',
        ddl: `CREATE TABLE IF NOT EXISTS "users" (
  "id" integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "email" character varying NOT NULL,
  "name" character varying NOT NULL,
  "password_hash" character varying NOT NULL,
  "is_admin" boolean,
  "age" integer,
  "year" character varying(20),
  "university" character varying(255),
  "department" character varying(255),
  "roll_no" character varying(100),
  "student_id" character varying(100),
  "photo_path" character varying(500),
  "id_card_path" character varying(500),
  "photo_data" bytea,
  "id_card_data" bytea,
  "id_verified" boolean,
  "verified_by" integer,
  "verified_at" timestamp without time zone,
  "email_verified" boolean,
  "admin_feedback" json,
  "created_at" timestamp without time zone,
  "admin_role" character varying(50),
  PRIMARY KEY ("id")
);`
    },
    {
        name: 'courses',
        ddl: `CREATE TABLE IF NOT EXISTS "courses" (
  "id" integer NOT NULL DEFAULT nextval('courses_id_seq'::regclass),
  "code" character varying(50) NOT NULL,
  "name" character varying(255) NOT NULL,
  "description" text,
  "created_at" timestamp without time zone,
  "updated_at" timestamp without time zone,
  PRIMARY KEY ("id")
);`
    },
    {
        name: 'papers',
        ddl: `CREATE TABLE IF NOT EXISTS "papers" (
  "id" integer NOT NULL DEFAULT nextval('papers_id_seq'::regclass),
  "course_id" integer,
  "uploaded_by" integer,
  "title" character varying(255) NOT NULL,
  "description" text,
  "paper_type" papertype NOT NULL,
  "year" integer,
  "semester" character varying(20),
  "department" character varying(255),
  "file_path" character varying(500),
  "file_name" character varying(255) NOT NULL,
  "file_size" integer,
  "file_data" bytea,
  "status" submissionstatus,
  "reviewed_by" integer,
  "reviewed_at" timestamp without time zone,
  "rejection_reason" text,
  "admin_feedback" json,
  "uploaded_at" timestamp without time zone,
  "updated_at" timestamp without time zone,
  "public_link_id" character varying(100),
  PRIMARY KEY ("id")
);`
    },
    {
        name: 'daily_challenges',
        ddl: `CREATE TABLE IF NOT EXISTS "daily_challenges" (
  "id" integer NOT NULL DEFAULT nextval('daily_challenges_id_seq'::regclass),
  "course_id" integer,
  "date" character varying(50) NOT NULL,
  "question" text NOT NULL,
  "code_snippet" text NOT NULL,
  "explanation" text NOT NULL,
  "media_link" character varying(500),
  "created_at" timestamp without time zone,
  PRIMARY KEY ("id")
);`
    },
    {
        name: 'daily_contests',
        ddl: `CREATE TABLE IF NOT EXISTS "daily_contests" (
  "id" integer NOT NULL DEFAULT nextval('daily_contests_id_seq'::regclass),
  "course_id" integer,
  "date" character varying(50) NOT NULL,
  "title" character varying(255),
  "description" text,
  "created_at" timestamp without time zone,
  PRIMARY KEY ("id")
);`
    },
    {
        name: 'contest_questions',
        ddl: `CREATE TABLE IF NOT EXISTS "contest_questions" (
  "id" integer NOT NULL DEFAULT nextval('contest_questions_id_seq'::regclass),
  "contest_id" integer,
  "order" integer NOT NULL,
  "title" character varying(255) NOT NULL,
  "question" text NOT NULL,
  "code_snippets" json NOT NULL,
  "explanation" text NOT NULL,
  "media_link" character varying(500),
  "created_at" timestamp without time zone,
  PRIMARY KEY ("id")
);`
    },
    {
        name: 'coding_announcements',
        ddl: `CREATE TABLE IF NOT EXISTS "coding_announcements" (
  "id" integer NOT NULL DEFAULT nextval('coding_announcements_id_seq'::regclass),
  "course_id" integer,
  "title" character varying(255) NOT NULL,
  "content" text NOT NULL,
  "attachment_url" character varying(500),
  "created_at" timestamp without time zone,
  PRIMARY KEY ("id")
);`
    }
];

async function migrate() {
    console.log('--- Starting Migration ---');

    const sourceUrl = process.env.SOURCE_DB_URL;
    const targetUrl = process.env.TARGET_DB_URL;

    if (!sourceUrl) {
        throw new Error('SOURCE_DB_URL is missing in .env');
    }
    if (!targetUrl) {
        throw new Error('TARGET_DB_URL is missing in .env. Please add the External Connection String from Render.');
    }

    const source = new Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
    const target = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });

    try {
        console.log('Connecting to databases...');
        await source.connect();
        await target.connect();
        console.log('Connected.');

        // 1. Create Enums
        console.log('\n--- Creating Enums ---');
        for (const [name, values] of Object.entries(ENUMS)) {
            try {
                // Check if type exists
                const check = await target.query(`SELECT 1 FROM pg_type WHERE typname = $1`, [name]);
                if (check.rowCount === 0) {
                    const valStr = values.map(v => `'${v}'`).join(', ');
                    await target.query(`CREATE TYPE ${name} AS ENUM (${valStr})`);
                    console.log(`Created ENUM: ${name}`);
                } else {
                    console.log(`ENUM ${name} already exists.`);
                }
            } catch (err) {
                console.error(`Error creating ENUM ${name}:`, err.message);
            }
        }

        // 2. Apply Schema (Tables)
        console.log('\n--- Applying Schema ---');
        for (const { name, ddl } of TABLES_DDL) {
            console.log(`Creating table: ${name}`);
            // Check if sequence logic needs adjustment (Render Postgres might not support 'nextval' without creating sequence first)
            // But usually 'serial' or 'generated always as identity' is better. 
            // The extracted DDL uses 'nextval'. We should ensure sequences exist or use SERIAL replacement for simplicity if needed.
            // PostgreSQL implicitely creates sequences for SERIAL. exact DDL usually assumes sequence exists if manually specified.
            // To be safe, we'll try to execute. If it fails on sequence, we might need to create it.
            // DDL says: DEFAULT nextval('users_id_seq'::regclass)
            // This requires the sequence to exist.

            // Hack: Replace 'integer NOT NULL DEFAULT nextval(...)' with 'SERIAL PRIMARY KEY' logic or create sequence.
            // Better: Create sequence if not exists.

            try {
                // Create sequence if implied by DDL
                if (ddl.includes('nextval')) {
                    const seqMatch = ddl.match(/nextval\('([^']+)'/);
                    if (seqMatch) {
                        const seqName = seqMatch[1];
                        await target.query(`CREATE SEQUENCE IF NOT EXISTS ${seqName}`);
                    }
                }

                await target.query(ddl);
                console.log(`Table ${name} ready.`);
            } catch (err) {
                console.error(`Error creating table ${name}:`, err.message);
            }
        }

        // 3. Migrate Data
        console.log('\n--- Migrating Data ---');
        for (const { name } of TABLES_DDL) {
            console.log(`\nTable: ${name}`);

            // Fetch from Source
            const res = await source.query(`SELECT * FROM "${name}"`);
            const rows = res.rows;
            console.log(`Found ${rows.length} rows in source.`);

            if (rows.length === 0) continue;

            let successCount = 0;
            let errorCount = 0;

            for (const row of rows) {
                const keys = Object.keys(row);
                const sendKeys = keys.map(k => `"${k}"`);
                const sendVals = Object.values(row);
                const sendPlaceholders = keys.map((_, i) => `$${i + 1}`);

                const insertQuery = `
                    INSERT INTO "${name}" (${sendKeys.join(', ')})
                    VALUES (${sendPlaceholders.join(', ')})
                    ON CONFLICT ("id") DO NOTHING
                `;

                try {
                    await target.query(insertQuery, sendVals);
                    successCount++;
                } catch (err) {
                    console.error(`Failed to insert row ID ${row.id}:`, err.message);
                    errorCount++;
                }
            }
            console.log(`Migrated ${successCount} rows. Errors: ${errorCount}`);

            // Sync Sequence
            try {
                const maxIdRes = await target.query(`SELECT MAX(id) as max_id FROM "${name}"`);
                const maxId = maxIdRes.rows[0].max_id;
                if (maxId) {
                    // Find sequence name
                    const ddlObj = TABLES_DDL.find(t => t.name === name);
                    const seqMatch = ddlObj.ddl.match(/nextval\('([^']+)'/);
                    if (seqMatch) {
                        const seqName = seqMatch[1];
                        await target.query(`SELECT setval('${seqName}', ${maxId})`);
                        console.log(`Sequence ${seqName} updated to ${maxId}`);
                    }
                }
            } catch (ignore) {
                // console.log('Sequence sync skipped');
            }
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await source.end();
        await target.end();
    }
}

migrate();
