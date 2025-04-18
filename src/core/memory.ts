import db from '../../sqlite'
import type { AIMessage } from '../../types'
import { v4 as uuidv4 } from 'uuid'

export type MessageWithMetaData = AIMessage & {
  id: string
  createdAt: string
  tool_calls?: any
  refusal?: string | null
  annotations?: any[]
}

export const addMetadata = (message: AIMessage): MessageWithMetaData => {
  return {
    ...message,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
}

export const removeMetaData = (message: MessageWithMetaData) => {
  const { id, createdAt, ...messageWithoutData } = message
  return messageWithoutData
}

export const addMessages = async (messages: AIMessage[]) => {
  const stmt = db.prepare(`
      INSERT INTO messages (id, role, content, tool_call_id, tool_calls, refusal, annotations, created_at
      ) VALUES (
        @id, @role, @content, @tool_call_id, @tool_calls, @refusal, @annotations, @created_at 
      )
    `)

  const insertMany = db.transaction((messages: MessageWithMetaData[]) => {
    for (const message of messages) {
      stmt.run({
        id: message.id,
        role: message.role,
        content: message.content ?? null,
        tool_call_id: message.tool_call_id ?? null,
        tool_calls: message.tool_calls
          ? JSON.stringify(message.tool_calls)
          : null,
        refusal: message.refusal ?? null,
        annotations: message.annotations
          ? JSON.stringify(message.annotations)
          : JSON.stringify([]),
        created_at: message.createdAt,
      })
    }
  })

  const messagesWithMetaData = messages.map(addMetadata)
  insertMany(messagesWithMetaData)
}

export const getMessages = async (): Promise<AIMessage[]> => {
  const rows: any[] = db
    .prepare('SELECT * FROM messages ORDER BY created_at ASC')
    .all()

  return rows.map((row) => ({
    role: row.role,
    content: row.content ?? null,
    tool_call_id: row.tool_call_id ?? undefined,
    tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
    refusal: row.refusal ?? undefined,
    annotations: row.annotations ? JSON.parse(row.annotations) : [],
  }))
}

export const saveToolResponse = async (
  toolResponse: string,
  toolCallId: string
) => {
  return await addMessages([
    {
      role: 'tool',
      content: toolResponse,
      tool_call_id: toolCallId,
    },
  ])
}

export const resetConversation = async () => {
  db.prepare('DELETE FROM messages').run()
  console.log('Conversation reset')
}
