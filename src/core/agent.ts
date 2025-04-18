import {
  getMessages,
  addMessages,
  saveToolResponse,
  resetConversation,
} from './memory'
import { runLLM } from './llm'
import { runTool } from '../tools/toolRunner'
import type { UICallbacks } from '../interfaces/interfaces'

// Default no-op implementations for when no UI is provided
const defaultCallbacks: UICallbacks = {
  logMessage: () => {},
  createLoader: () => ({
    stop: () => {},
    succeed: () => {},
    fail: () => {},
    update: () => {},
  }),
}
export const runAgent = async ({
  userMessage,
  tools,
  uiCallbacks = defaultCallbacks, // Add this parameter with defaults
}: {
  userMessage: string
  tools: any[]
  uiCallbacks?: UICallbacks // Optional UI callbacks
}) => {
  // Reset conversation state before starting a new one
  await resetConversation()

  // Add user message to start fresh conversation
  await addMessages([{ role: 'user', content: userMessage }])

  const loader = uiCallbacks.createLoader('🤔')

  // First API call
  const history = await getMessages()
  const response = await runLLM({
    messages: history,
    tools,
  })

  // If there are no tool calls, just handle it directly
  if (!response.tool_calls || response.tool_calls.length === 0) {
    await addMessages([response])
    uiCallbacks.logMessage(response) // Use the callback instead
    loader.stop()
    return getMessages()
  }

  // If we get here, we have tool calls to handle
  loader.update('executing tools...')

  // Save the assistant response with tool calls
  await addMessages([response])

  // Process each tool call
  for (const toolCall of response.tool_calls) {
    loader.update(`executing ${toolCall.function.name}...`)

    try {
      const toolCallResponse = await runTool(toolCall, userMessage)
      // Save the tool response - this function correctly formats it with role: 'tool'
      await saveToolResponse(
        typeof toolCallResponse === 'string'
          ? toolCallResponse
          : JSON.stringify(toolCallResponse),
        toolCall.id
      )
      loader.update(`executed ${toolCall.function.name}`)
    } catch (error) {
      console.error(`Error executing tool ${toolCall.function.name}:`, error)
      await saveToolResponse(
        `Error executing: ${toolCall.function.name}: ${error}`,
        toolCall.id
      )
    }
  }

  // Get updated history with tool responses
  const updatedHistory = await getMessages()

  // Make final API call
  const finalResponse = await runLLM({
    messages: updatedHistory,
    tools,
  })

  // Save final response
  await addMessages([finalResponse])
  uiCallbacks.logMessage(finalResponse) // Use the callback instead

  loader.stop()
  return getMessages()
}
