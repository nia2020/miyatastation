/* eslint-disable */
import { Client } from "pg";

// 使うときは process.env.SUPABASE_DB_URL に Connection string を入れて実行する。
// 例: SUPABASE_DB_URL="postgresql://postgres.xxx:PASSWORD@aws-x-...pooler.supabase.com:5432/postgres" npx tsx scripts/apply-section-views-migration.ts
const CONNECTION_STRING = process.env.SUPABASE_DB_URL;
if (!CONNECTION_STRING) {
  console.error("SUPABASE_DB_URL is not set");
  process.exit(1);
}

const SQL = `
ALTER TABLE public.user_section_views
  DROP CONSTRAINT IF EXISTS user_section_views_section_check;

ALTER TABLE public.user_section_views
  ADD CONSTRAINT user_section_views_section_check
  CHECK (
    section IN (
      'events',
      'forms',
      'chat',
      'archive_videos',
      'message_collection',
      'google_forms',
      'mk_room',
      'usage_guide'
    )
  );
`;

async function main() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("connected");

  console.log("\n--- BEFORE: current CHECK constraint ---");
  const before = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conname = 'user_section_views_section_check'
  `);
  console.log(before.rows);

  console.log("\n--- applying ALTER TABLE ... ---");
  await client.query(SQL);
  console.log("applied");

  console.log("\n--- AFTER: current CHECK constraint ---");
  const after = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conname = 'user_section_views_section_check'
  `);
  console.log(after.rows);

  await client.end();
  console.log("\ndone");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
