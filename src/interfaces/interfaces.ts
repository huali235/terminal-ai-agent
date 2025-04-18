// src/interfaces/interfaces.ts - New file for shared interface definitions
import type { AIMessage } from '../../types'

// Interface for a loader that can be updated
export interface LoaderInterface {
  stop: () => void
  succeed: (text?: string) => void
  fail: (text?: string) => void
  update: (text: string) => void
}

// Define interfaces for UI Callbacks
export interface UICallbacks {
  logMessage: (message: AIMessage) => void
  createLoader: (text: string) => LoaderInterface
}
