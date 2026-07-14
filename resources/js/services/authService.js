import { api, initializeCsrf, mockResponse } from '@/utils/api'

export const authService = {
  async register(data) {
    await initializeCsrf()
    return api.post('/auth/register', data)
  },

  async login(data) {
    await initializeCsrf()
    return api.post('/auth/login', data)
  },

  async logout() {
    await initializeCsrf()
    return api.post('/auth/logout')
  },

  async me() {
    return api.get('/auth/me')
  },

  async forgotPassword() {
    return mockResponse(null, 'Password reset email queued in demo mode')
  },

  async resetPassword() {
    return mockResponse(null, 'Password reset in demo mode')
  },

  async updateProfile(data) {
    return api.put('/auth/profile', data)
  },

  async changePassword(data) {
    return api.post('/auth/change-password', data)
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)

    return api.post('/auth/avatar', formData)
  },

  async deleteAvatar() {
    return api.delete('/auth/avatar')
  },
}
