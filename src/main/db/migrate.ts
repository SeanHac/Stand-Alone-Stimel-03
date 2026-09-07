import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import path from 'node:path'
import type * as schema from './schema'

/**
 * Applies any migrations the open database has not yet seen.
 *
 * This is what allows a therapist's existing database to be upgraded in
 * place when a new version ships. It must run after the database is opened
 * with the user's key and before any query touches application tables.
 */
export function runMigrations(db: BetterSQLite3Database<typeof schema>): void {
  const migrationsFolder = is.dev
    ? path.join(app.getAppPath(), 'drizzle')
    : path.join(process.resourcesPath, 'drizzle')

  migrate(db, { migrationsFolder })
}
