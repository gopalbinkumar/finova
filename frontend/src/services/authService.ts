import { api } from '@/utils/api'
import type {
  AuthTokenResponse,
  ChangePasswordData,
  ForgotPasswordData,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UpdateProfileData,
  ApiResponse,
  User,
} from '@/types/auth'

const AUTH = '/auth'

export const authService = {
  register: (data: RegisterData) =>
    api.post<AuthTokenResponse>(`${AUTH}/register`, data),

  login: (data: LoginCredentials) =>
    api.post<AuthTokenResponse>(`${AUTH}/login`, data),

  logout: () =>
    api.post<ApiResponse>(`${AUTH}/logout`),

  me: () =>
    api.get<ApiResponse<User>>(`${AUTH}/me`),

  forgotPassword: (data: ForgotPasswordData) =>
    api.post<ApiResponse>(`${AUTH}/forgot-password`, data),

  resetPassword: (data: ResetPasswordData) =>
    api.post<ApiResponse>(`${AUTH}/reset-password`, data),

  updateProfile: (data: UpdateProfileData) =>
    api.put<ApiResponse<User>>(`${AUTH}/profile`, data),

  changePassword: (data: ChangePasswordData) =>
    api.put<ApiResponse>(`${AUTH}/change-password`, data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post<ApiResponse<User>>(`${AUTH}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteAvatar: () =>
    api.delete<ApiResponse<User>>(`${AUTH}/avatar`),
}
