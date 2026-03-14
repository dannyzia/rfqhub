// Frontend environment config — reads from Vite's import.meta.env
// In dev: set in .env.local; In production: set in deployment environment

export const env = {
  /** Backend API base URL (no trailing slash) */
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',

  /** Public app URL (canonical origin, e.g. for auth redirects) */
  APP_URL: import.meta.env.VITE_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : ''),

  /** Whether we're in development mode */
  isDev: import.meta.env.DEV,

  /** Whether we're in production mode */
  isProd: import.meta.env.PROD,

  /** Use mock data instead of real API (for prototype mode) */
  USE_MOCK: import.meta.env.VITE_USE_MOCK !== 'false',
} as const;