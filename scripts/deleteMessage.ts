import Database from 'better-sqlite3'

const db = new Database('memory.db')

const idsToDelete = []

const placeholders = idsToDelete.map(() => '?').join(', ')
db.prepare(`DELETE FROM messages WHERE id IN (${placeholders})`).run(
  ...idsToDelete
)
