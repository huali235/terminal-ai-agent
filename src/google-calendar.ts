import * as fs from 'fs/promises'
import * as path from 'path'
import * as process from 'process'
import { authenticate } from '@google-cloud/local-auth'
import { google, calendar_v3 } from 'googleapis'

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

    // Parse the requested date (which comes in YYYY-MM-DD format from parseDateFromQuery)
    const [year, month, day] = date.split('-').map((num) => parseInt(num, 10))

    // Create UTC date ranges to avoid timezone issues
    // Month is 0-indexed in JavaScript Date
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

    console.log(
      `Fetching events between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`
    )

    // Get events for the specified date
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100, // Retrieve more events if available
    })

    // Add debug logging
    console.log(`API Response status: ${response.status}`)
    console.log(`Found ${response.data.items?.length || 0} events`)

    const events = response.data.items || []

    if (events.length === 0) {
      // Create a date object that represents the local date without time zone issues
      const displayDate = new Date(year, month - 1, day)
      const formattedDate = displayDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      return `No events found for ${formattedDate}.`
    }

    // Format the date for display
    const displayDate = new Date(year, month - 1, day)
    const formattedDate = displayDate.toLocaleDateString('en-US', {
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

      // Format location information
      let locationInfo = ''
      if (event.location) {
        locationInfo = ` (${event.location})`
      }

      result += `- ${event.summary}${timeInfo}${locationInfo}\n`
    })

    return result
  } catch (error) {
    console.error('Error retrieving calendar events:', error)
    if (error instanceof Error) {
      return `Error retrieving calendar events: ${error.message}`
    }
    return 'Error retrieving calendar events. Please try again.'
  }
}
