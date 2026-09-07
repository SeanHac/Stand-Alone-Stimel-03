import { app } from 'electron'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let connection: Database.Database | null = null
let database: BetterSQLite3Database<typeof schema> | null = null

export function getDbPath(): string {
  return path.join(app.getPath('userData'), 'stimel.db')
}

/**
 * Opens the encrypted database. Throws if the key is wrong.
 * The key is a hex string; never log it, never send it to the renderer.
 */
export function openDatabase(hexKey: string): BetterSQLite3Database<typeof schema> {
  if (database) return database

  const conn = new Database(getDbPath())

  // Must come before any other statement.
  conn.pragma(`key = "x'${hexKey}'"`)

  // Fails here if the key is wrong — the file cannot be read at all.
  conn.prepare('SELECT count(*) FROM sqlite_master').get()

  conn.pragma('journal_mode = WAL')
  conn.pragma('foreign_keys = ON')

  connection = conn
  database = drizzle(conn, { schema })
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