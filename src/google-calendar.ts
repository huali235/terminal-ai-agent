import * as fs from 'fs/promises'
import * as path from 'path'
import * as process from 'process'
import { authenticate } from '@google-cloud/local-auth'
import { google, calendar_v3 } from 'googleapis'
import { testAuth } from '../auth_test'

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json')
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json')

/**
 * Reads previously authorized credentials from the save file.
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH)
    const credentials = JSON.parse(content.toString())
    return google.auth.fromJSON(credentials)
  } catch (err) {
    return null
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 */
async function saveCredentials(client: any) {
  const content = await fs.readFile(CREDENTIALS_PATH)
  const keys = JSON.parse(content.toString())
  const key = keys.installed || keys.web
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  })
  await fs.writeFile(TOKEN_PATH, payload)
}

/**
 * Load or request authorization to call APIs.
 */
async function getAuthClient() {
  let client = await loadSavedCredentialsIfExist()
  if (client) {
    return client
  }

  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  })

  if (client.credentials) {
    await saveCredentials(client)
  }
  return client
}

export async function getEventsForDate(date: string): Promise<string> {
  try {
    // Get authenticated client
    const auth = await getAuthClient()
    const calendar = google.calendar({ version: 'v3', auth })

    // Parse the requested date
    const requestedDate = new Date(date)
    const startOfDay = new Date(requestedDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(requestedDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get events for the specified date
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items || []

    if (events.length === 0) {
      const formattedDate = requestedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      return `No events found for ${formattedDate}.`
    }

    // Format the date for display
    const formattedDate = requestedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })

    // Format the response
    let result = `Events for ${formattedDate}:\n`
    events.forEach((event) => {
      const start = event.start?.dateTime || event.start?.date
      if (!start) return

      let timeInfo = ''
      if (event.start?.dateTime) {
        // Event with specific time
        const startTime = new Date(start).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })
        timeInfo = ` at ${startTime}`
      }

      result += `- ${event.summary}${timeInfo}\n`
    })

    return result
  } catch (error) {
    console.error('Error retrieving calendar events:', error)
    return 'Error retrieving calendar events. Please try again.'
  }
}
