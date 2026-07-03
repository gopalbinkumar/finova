// Auth types for Finova

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  currency: string
  timezone: string
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface AuthTokenResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

export interface ApiResponse<T = null> {
  success: boolean
  message: string
  data: T
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface ChangePasswordData {
  current_password: string
  password: string
  password_confirmation: string
}

export interface UpdateProfileData {
  name: string
  email: string
  phone?: string
  currency?: string
  timezone?: string
  theme?: 'light' | 'dark' | 'system'
}

export interface ValidationError {
  message: string
  errors: Record<string, string[]>
}
