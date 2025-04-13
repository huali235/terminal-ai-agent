# Building an AI Agent from Scratch

## Description

This project is a **customized AI-powered chatbot** designed to run directly in the terminal. It leverages OpenAI's API and GPT-4 model to process user inputs, execute tool-based operations, and generate intelligent, context-aware responses. The chatbot is built with a modular architecture that integrates natural language processing, tool orchestration, and memory management for seamless conversational interactions.

Additionally, the chatbot integrates the **OpenWeather API** for real-time weather updates and the **Google Calendar API** for managing events and schedules, enhancing its functionality and providing a more comprehensive user experience.

## Features

- **AI-Powered Conversations**: Utilizes OpenAI's GPT-4 model for intelligent and context-aware responses.
- **Tool Integration**: Supports tool-based operations to enhance functionality.
- **Weather Updates**: Fetches real-time weather information using the OpenWeather API.
- **Calendar Management**: Integrates with Google Calendar API to manage events and schedules.
- **Terminal-Based Interface**: Runs directly in the terminal for easy access and usage.
- **Customizable**: Designed to be extended and tailored to specific use cases.

## Technologies Used

- **Languages**: Node.js, TypeScript
- **AI Model**: OpenAI API (GPT-4)
- **APIs**:
  - OpenWeather API
  - Google Calendar API
- **Database**: SQLite
- **Libraries**:
  - Got: For making HTTP requests to external APIs.
  - Zod: For schema validation and input validation.
  - Ora: For terminal-based loading indicators.
  - Terminal-Image: For displaying images in the terminal.
  - UUID: For generating unique identifiers.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
