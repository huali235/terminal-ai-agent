// In your main file where you handle agent functionality

import { getEventsForDate } from './google-calendar'

export async function handleCalendarRequest(query: string): Promise<string> {
  // Parse the date from the query
  const dateString = parseDateFromQuery(query)
  return await getEventsForDate(dateString)
}

function parseDateFromQuery(query: string): string {
  const lowerQuery = query.toLowerCase()
  const today = new Date()

  // Check for today
  if (
    lowerQuery.includes('today') ||
    lowerQuery.includes('now') ||
    lowerQuery.includes('this day')
  ) {
    return today.toISOString().split('T')[0] // Returns YYYY-MM-DD
  }

  // Check for tomorrow
  if (
    lowerQuery.includes('tomorrow') ||
    lowerQuery.includes('next day') ||
    lowerQuery.includes('day after')
  ) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Check for specific date mentions (simplified)
  // In a production environment, you'd want more sophisticated date parsing
  const datePattern = /\d{4}-\d{2}-\d{2}/
  const match = query.match(datePattern)
  if (match) {
    return match[0]
  }

  // Default to today
  return today.toISOString().split('T')[0]
}
