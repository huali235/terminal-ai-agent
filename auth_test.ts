import { authenticate } from '@google-cloud/local-auth'
import path from 'path'

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json')

export async function testAuth() {
  try {
    const client = await authenticate({
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      keyfilePath: CREDENTIALS_PATH,
    })
    console.log('Authentication successful!')
    console.log('Client:', client) // Log the client object
  } catch (error) {
    console.error('Authentication failed:', error)
  }
}
