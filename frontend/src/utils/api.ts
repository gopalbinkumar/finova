import axios, { AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://finova.test/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

// Attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finova_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('finova_token')
      localStorage.removeItem('finova_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Extract a human-readable error message from an Axios error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> }
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0]
      return data.errors[firstKey][0]
    }
    if (data?.message) return data.message
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}

/**
 * Extract field-level validation errors from an Axios error.
 */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { errors?: Record<string, string[]> }
    if (data?.errors) {
      return Object.fromEntries(
        Object.entries(data.errors).map(([key, messages]) => [key, messages[0]])
      )
    }
  }
  return {}
}
