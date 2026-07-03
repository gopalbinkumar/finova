import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { getErrorMessage } from '@/utils/api'
import type {
  ChangePasswordData,
  ForgotPasswordData,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UpdateProfileData,
} from '@/types/auth'

// ─── Login ───────────────────────────────────────────────────────────────────
export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginCredentials) => authService.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.token)
      navigate('/dashboard')
    },
  })
}

// ─── Register ────────────────────────────────────────────────────────────────
export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.token)
      navigate('/dashboard')
    },
  })
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout()
      qc.clear()
      navigate('/login')
    },
  })
}

// ─── Me (current user) ───────────────────────────────────────────────────────
export function useMe() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authService.forgotPassword(data),
  })
}

// ─── Reset Password ──────────────────────────────────────────────────────────
export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: ResetPasswordData) => authService.resetPassword(data),
    onSuccess: () => {
      navigate('/login?reset=1')
    },
  })
}

// ─── Update Profile ──────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const { setUser } = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileData) => authService.updateProfile(data),
    onSuccess: ({ data }) => {
      setUser(data.data)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// ─── Change Password ─────────────────────────────────────────────────────────
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => authService.changePassword(data),
  })
}

// ─── Upload Avatar ───────────────────────────────────────────────────────────
export function useUploadAvatar() {
  const { setUser } = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => authService.uploadAvatar(file),
    onSuccess: ({ data }) => {
      setUser(data.data)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// ─── Delete Avatar ───────────────────────────────────────────────────────────
export function useDeleteAvatar() {
  const { setUser } = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => authService.deleteAvatar(),
    onSuccess: ({ data }) => {
      setUser(data.data)
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// ─── Shared error helper ─────────────────────────────────────────────────────
export { getErrorMessage }
