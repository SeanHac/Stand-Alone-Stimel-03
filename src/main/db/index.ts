import { app } from 'electron'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { runMigrations } from './migrate'
import { seedPrograms } from './seed'

let connection: Database.Database | null = null
let database: BetterSQLite3Database<typeof schema> | null = null

export function getDbPath(): string {
  return path.join(app.getPath('userData'), 'stimel.db')
}

/**
 * Opens the encrypted database, applies any pending migrations, and
 * ensures the program reference data is present.
 *
 * Throws if the key is wrong — the file cannot be read at all without it.
 * The key is a hex string: never log it, never write it to disk, never
 * send it to the renderer.
 */
export function openDatabase(hexKey: string): BetterSQLite3Database<typeof schema> {
  if (database) return database

  const conn = new Database(getDbPath())

  // Must be the first statement on the connection. Setting any other
  // pragma before this one fails.
  conn.pragma(`key = "x'${hexKey}'"`)

  // Fails here if the key is wrong.
  conn.prepare('SELECT count(*) FROM sqlite_master').get()

  conn.pragma('journal_mode = WAL')

  // Off by default in SQLite. Without this the ON DELETE cascade from
  // patients to sessions silently does nothing and orphaned rows build up.
  conn.pragma('foreign_keys = ON')

  connection = conn
  database = drizzle(conn, { schema })

  // Order matters. Migrations create the tables; the seed writes into them.
  try {
    runMigrations(database)
    seedPrograms(database)
  } catch (error) {
    // Leaving a half-open connection behind would make the next attempt
    // return it from the cache above and hide the real failure.
    closeDatabase()
    throw error
  }

  return database
}

export function closeDatabase(): void {
  connection?.close()
  connection = null
  database = null
}

export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!database) throw new Error('Database is not open')
  return database
}