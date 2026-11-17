import { getDb } from '../config/db.js';
import { getOrSetCache, invalidateCachePrefix } from '../config/cache.js';

const DEFAULT_MESSAGE = 'We are performing scheduled maintenance on Learn JKLU. The archive will be back online shortly.';
let settingsTableEnsured = false;

async function ensureSettingsTable(db) {
  if (settingsTableEnsured) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  settingsTableEnsured = true;
}

export async function getMaintenanceStatus() {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return {
      maintenance_mode: true,
      message: process.env.MAINTENANCE_MESSAGE || DEFAULT_MESSAGE,
      manual_override: true,
    };
  }

  return getOrSetCache('site:maintenance', 5000, async () => {
    try {
      const db = await getDb();
      await ensureSettingsTable(db);
      const res = await db.query('SELECT value FROM site_settings WHERE key = $1 LIMIT 1', [
        'maintenance',
      ]);
      if (res.rowCount > 0 && res.rows[0].value) {
        const val = res.rows[0].value;
        return {
          maintenance_mode: Boolean(val.enabled),
          message: String(val.message || DEFAULT_MESSAGE),
          manual_override: false,
        };
      }
    } catch {
      // Fallback to off if DB is unavailable
    }
    return {
      maintenance_mode: false,
      message: DEFAULT_MESSAGE,
      manual_override: false,
    };
  });
}

export async function setMaintenanceStatus({ enabled, message, updatedBy }) {
  const db = await getDb();
  await ensureSettingsTable(db);
  const payload = {
    enabled: Boolean(enabled),
    message: String(message || DEFAULT_MESSAGE).trim() || DEFAULT_MESSAGE,
    updated_by: updatedBy || null,
    updated_at: new Date().toISOString(),
  };
  await db.query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ('maintenance', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(payload)]
  );
  invalidateCachePrefix('site:');
  return {
    maintenance_mode: payload.enabled,
    message: payload.message,
    manual_override: process.env.MAINTENANCE_MODE === 'true',
  };
}
