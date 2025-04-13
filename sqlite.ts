import Database from 'better-sqlite3'

const db = new Database('memory.db')

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        content TEXT,
        tool_call_id TEXT,
        tool_calls TEXT,
        refusal TEXT,
        annotations TEXT,
        created_at TEXT NOT NULL
    )
`)

export default db
