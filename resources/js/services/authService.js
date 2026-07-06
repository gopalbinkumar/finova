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
    const current = await this.me()
    return mockResponse({ ...current.data.data.user, ...data })
  },

  async changePassword() {
    return mockResponse(null, 'Password changed in demo mode')
  },

  async uploadAvatar(file) {
    const current = await this.me()
    return mockResponse({
      ...current.data.data.user,
      avatar_url: URL.createObjectURL(file),
    })
  },

  async deleteAvatar() {
    const current = await this.me()
    return mockResponse({ ...current.data.data.user, avatar_url: null })
  },
}
