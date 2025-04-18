// In llm.ts
import type { AIMessage } from '../../types'
import { openai } from './ai'
import { zodFunction } from 'openai/src/helpers/zod.js'

export const runLLM = async ({
  messages,
  tools,
}: {
  messages: AIMessage[]
  tools: any[]
}) => {
  // Make sure to filter out any "orphaned" tool messages
  // (tool messages without a preceding assistant message with tool_calls)
  const cleanedMessages = cleanMessageHistory(messages)

  const formattedTools = tools.map(zodFunction)
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.1,
    messages: cleanedMessages,
    tools: formattedTools,
    tool_choice: 'auto',
    parallel_tool_calls: false,
  })

  return response.choices[0].message
}

// Helper function to clean message history
function cleanMessageHistory(messages) {
  const cleanedMessages = []
  let lastAssistantHadToolCalls = false

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    // If this is a tool message
    if (msg.role === 'tool') {
      // Only include it if the previous message was an assistant with tool_calls
      if (lastAssistantHadToolCalls) {
        cleanedMessages.push({
          role: 'tool',
          tool_call_id: msg.tool_call_id,
          content: msg.content || '',
        })
      }
      // Otherwise skip this tool message
      continue
    }

    // For non-tool messages, update our tracking variable
    lastAssistantHadToolCalls =
      msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0

    // Include this message in our cleaned list
    const cleanMsg = { role: msg.role }

    // Handle content field properly
    if (msg.content !== null && msg.content !== undefined) {
      cleanMsg.content = msg.content
    } else {
      cleanMsg.content = '' // Provide empty string if content is null
    }

    // Include tool_calls if this is an assistant message with tool calls
    if (lastAssistantHadToolCalls) {
      cleanMsg.tool_calls = msg.tool_calls
    }

    cleanedMessages.push(cleanMsg)
  }

  return cleanedMessages
}
