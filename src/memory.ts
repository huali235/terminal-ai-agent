import { JSONFilePreset } from 'lowdb/node'
import type { AIMessage } from '../types'
import { v4 as uuidv4 } from 'uuid'

export type MessageWithMetaData = AIMessage & {
  id: string
  createdAt: string
}

type Data = {
  messages: MessageWithMetaData[]
}

export const addMetadata = (message: AIMessage) => {
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

const defaultData: Data = {
  messages: [],
}

const getDb = async () => {
  const db = await JSONFilePreset<Data>('db.json', defaultData)
  return db
}

export const addMessages = async (messages: AIMessage[]) => {
  const db = await getDb()
  db.data.messages.push(...messages.map(addMetadata))
  await db.write()
}

export const getMessages = async () => {
  const db = await getDb()
  return db.data.messages.map(removeMetaData)
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
