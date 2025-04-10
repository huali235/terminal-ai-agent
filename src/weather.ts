const API_KEY = process.env.OPENWEATHER_API_KEY

interface GeoLocation {
  name: string
  lat: number
  lon: number
}

interface WeatherItem {
  temp: number
  weather: {
    description: string
    id: number
    main: string
    icon: string
  }[]
}

interface DailyWeatherItem {
  weather: {
    description: string
    id: number
    main: string
    icon: string
  }[]
  temp: {
    min: number
    max: number
  }
}

interface WeatherResponse {
  current: WeatherItem
  hourly: WeatherItem[]
  daily: DailyWeatherItem[]
}

const getCoordinates = async (
  location: string
): Promise<{ lat: number; lon: number; name: string }> => {
  const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    location
  )}&limit=1&appid=${API_KEY}`

  const geoResponse = await fetch(geoUrl)

  if (!geoResponse.ok) {
    throw new Error(
      `Geocoding API error: ${geoResponse.status} ${geoResponse.statusText}`
    )
  }

  const geoData = (await geoResponse.json()) as GeoLocation[]

  if (!geoData.length) {
    throw new Error(`No coordinates found for location: ${location}`)
  }

  return { lat: geoData[0].lat, lon: geoData[0].lon, name: geoData[0].name }
}

export const getWeather = async ({
  location,
  type = 'current',
}: {
  location: string
  type?: 'current' | 'hourly' | 'daily'
}) => {
  if (!API_KEY) {
    throw new Error(
      'OpenWeather API key not found. Please check your environment variables.'
    )
  }

  try {
    const { lat, lon, name } = await getCoordinates(location)

    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=imperial&appid=${API_KEY}`

    const weatherResponse = await fetch(weatherUrl)

    if (!weatherResponse.ok) {
      throw new Error(
        `Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`
      )
    }

    const weatherData = (await weatherResponse.json()) as WeatherResponse

    switch (type) {
      case 'current':
        return `The current weather in ${name} is ${weatherData.current.weather[0].description} with a temperature of ${weatherData.current.temp}°F.`

      case 'hourly':
        const hourlyWeather = weatherData.hourly
          .slice(0, 12) // Get the next 12 hours
          .map((hour, index) => {
            // Get current time and add 'index' hours to it
            const time = new Date()
            time.setHours(time.getHours() + index)

            // Format the time as HH:00 (24-hour format)
            const formattedTime = `${time.getHours()}:00`

            return `${formattedTime}: ${hour.weather[0].description}, ${hour.temp}°F`
          })
          .join('\n')
        return `Hourly weather for ${name}:\n${hourlyWeather}`

      case 'daily':
        const dailyWeather = weatherData.daily
          .slice(0, 7) // Get the next 7 days
          .map((day, index) => {
            // Get current date and add 'index' days to it
            const date = new Date()
            date.setDate(date.getDate() + index)

            // Format the date as "Month Day" (e.g., "April 5")
            const monthNames = [
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
            ]
            const formattedDate = `${
              monthNames[date.getMonth()]
            } ${date.getDate()}`

            return `${formattedDate}: ${day.weather[0].description}, High: ${day.temp.max}°F, Low: ${day.temp.min}°F`
          })
          .join('\n')
        return `Weekly weather for ${name}:\n${dailyWeather}`

      default:
        throw new Error(
          'Invalid weather type. Please specify "current", "hourly", or "daily".'
        )
    }
  } catch (error) {
    // Log the specific error for debugging
    console.error('Weather tool error:', error)

    // Return a user-friendly message
    if (error instanceof Error) {
      return `Failed to fetch weather data: ${error.message}`
    }
    return 'Failed to fetch weather data. Please try again.'
  }
}

// const API_KEY = process.env.OPENWEATHER_API_KEY

// interface GeoLocation {
//   name: string
//   lat: number
//   lon: number
// }

// const getCoordinates = async (location: string) => {
//   const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
//     location
//   )}&limit=1&appid=${API_KEY}`

//   const geoResponse = await fetch(geoUrl)

//   const geoData = (await geoResponse.json()) as GeoLocation[]

//   if (!geoData.length) {
//     throw new Error(`No coordinates found for location: ${location}`)
//   }

//   return { lat: geoData[0].lat, lon: geoData[0].lon, name: geoData[0].name }
// }

// interface WeatherResponse {
//   current: {
//     temp: number
//     weather: {
//       description: string
//       id: number
//       main: string
//       icon: string
//     }[]
//   }
// }

// export const getWeather = async ({
//   location,
//   type,
// }: {
//   location: string
//   type: 'current' | 'hourly' | 'daily'
// }) => {
//   if (!API_KEY) {
//     throw new Error('API key not found')
//   }
//   try {
//     const { lat, lon, name } = await getCoordinates(location)

//     const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=imperial&appid=${API_KEY}`

//     const weatherResponse = await fetch(weatherUrl)
//     const weatherData = (await weatherResponse.json()) as WeatherResponse

//     switch (type) {
//       case 'current':
//         return `The current weather in ${name} is ${weatherData.current.weather[0].description} with a temperature of ${weatherData.current.temp}°F.`

//       case 'hourly':
//         const hourlyWeather = weatherData.hourly
//           .slice(0, 12) // Get the next 12 hours
//           .map(
//             (hour, index) =>
//               `Hour ${index + 1}: ${hour.weather[0].description}, ${
//                 hour.temp
//               }°F`
//           )
//           .join('\n')
//         return `Hourly weather for ${name}:\n${hourlyWeather}`

//       case 'daily':
//         const dailyWeather = weatherData.daily
//           .slice(0, 7) // Get the next 7 days
//           .map(
//             (day, index) =>
//               `Day ${index + 1}: ${day.weather[0].description}, High: ${
//                 day.temp.max
//               }°F, Low: ${day.temp.min}°F`
//           )
//           .join('\n')
//         return `Weekly weather for ${name}:\n${dailyWeather}`

//       default:
//         throw new Error(
//           'Invalid weather type. Please specify "current", "hourly", or "daily".'
//         )
//     }
//   } catch (error) {
//     console.error(error)
//     return 'Failed to fetch weather data. Please try again.'
//   }
// }
