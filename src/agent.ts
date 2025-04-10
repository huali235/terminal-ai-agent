import { getMessages, addMessages, saveToolResponse } from './memory'
import { runLLM } from './llm'
import { showLoader, logMessage } from './ui'
import { runTool } from './toolRunner'

export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string
  tools: any[]
}) => {
  await addMessages([{ role: 'user', content: userMessage }])

  const loader = showLoader('🤔')

  const history = await getMessages()
  const response = await runLLM({
    messages: history,
    tools,
  })

  await addMessages([response])

  if (response.tool_calls && response.tool_calls.length > 0) {
    loader.update('executing tools...')

    for (const toolCall of response.tool_calls) {
      loader.update(`executing ${toolCall.function.name}...`)

      try {
        const toolCallResponse = await runTool(toolCall, userMessage)
        await saveToolResponse(toolCallResponse, toolCall.id)
        loader.update(`executed ${toolCall.function.name}`)
      } catch (error) {
        console.error(`Error executing tool ${toolCall.function.name}:`, error)

        await saveToolResponse(
          `Error executing: ${toolCall.function.name}: ${error}`,
          toolCall.id
        )
      }
    }

    // const toolCallResponse = await runTool(toolCalls, userMessage)
    // await saveToolResponse(toolCallResponse, toolCalls.id)
    // loader.update(`executed ${toolCalls.function.name}`)

    // Add this section to make a second LLM call with the tool response
    const updatedHistory = await getMessages()
    const finalResponse = await runLLM({
      messages: updatedHistory,
      tools,
    })

    // Add the final response to the messages
    await addMessages([finalResponse])

    // Log the final response
    logMessage(finalResponse)
  } else {
    // If no tool was called, just log the original response
    logMessage(response)
  }

  loader.stop()
  return getMessages()
}
