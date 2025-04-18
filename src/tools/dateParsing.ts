// In your main file where you handle agent functionality

import { getEventsForDate } from './google-calendar'

export async function handleCalendarRequest(query: string): Promise<string> {
  // Parse the date from the query
  console.log(`Original query: "${query}"`)
  const dateString = parseDateFromQuery(query)
  console.log(`Parsed date: ${dateString}`)
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

  // Check for month and day format (e.g., "April 13")
  const monthNames = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ]

  for (let i = 0; i < monthNames.length; i++) {
    const monthName = monthNames[i]
    if (lowerQuery.includes(monthName)) {
      // Find day number that follows the month name
      const dayRegex = new RegExp(`${monthName}\\s+(\\d{1,2})`, 'i')
      const match = lowerQuery.match(dayRegex)

      if (match && match[1]) {
        const day = parseInt(match[1], 10)
        const year = today.getFullYear()

        // Handle if the month has already passed this year
        const monthIndex = i
        let targetYear = year

        if (
          monthIndex < today.getMonth() ||
          (monthIndex === today.getMonth() && day < today.getDate())
        ) {
          targetYear = year + 1 // Assume next year if the date has passed
        }

        const date = new Date(targetYear, monthIndex, day)
        return date.toISOString().split('T')[0]
      }
    }
  }

  // Check for specific date mentions in YYYY-MM-DD format
  const datePattern = /\d{4}-\d{2}-\d{2}/
  const match = query.match(datePattern)
  if (match) {
    return match[0]
  }

  // Check for MM/DD/YYYY or MM-DD-YYYY format
  const slashDatePattern = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/
  const slashMatch = query.match(slashDatePattern)
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1 // Months are 0-indexed in JS
    const day = parseInt(slashMatch[2], 10)
    const year = slashMatch[3]
      ? parseInt(slashMatch[3], 10)
      : today.getFullYear()

    const date = new Date(year, month, day)
    return date.toISOString().split('T')[0]
  }

  // Default to today
  return today.toISOString().split('T')[0]
}
