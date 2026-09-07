import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const healthCheck = sqliteTable('health_check', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  note: text('note').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})