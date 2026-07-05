import { mockUser } from '@/data/mockData'
import { mockResponse } from '@/utils/api'

const DEMO_DELAY = 250

function wait() {
  return new Promise((resolve) => window.setTimeout(resolve, DEMO_DELAY))
}

function currentStoredUser() {
  try {
    const stored = JSON.parse(localStorage.getItem('finova_auth') ?? '{}')
    return stored?.state?.user ?? mockUser
  } catch {
    return mockUser
  }
}

export const authService = {
  async register(data) {
    await wait()
    return mockResponse({
      user: {
        ...mockUser,
        name: data.name,
        email: data.email,
        updated_at: new Date().toISOString(),
      },
      token: 'demo-token-finova',
    }, 'Registered in demo mode')
  },

  async login() {
    await wait()
    return mockResponse({
      user: currentStoredUser(),
      token: 'demo-token-finova',
    }, 'Logged in demo mode')
  },

  async logout() {
    await wait()
    return mockResponse(null, 'Logged out')
  },

  async me() {
    await wait()
    return mockResponse(currentStoredUser())
  },

  async forgotPassword() {
    await wait()
    return mockResponse(null, 'Password reset email queued in demo mode')
  },

  async resetPassword() {
    await wait()
    return mockResponse(null, 'Password reset in demo mode')
  },

  async updateProfile(data) {
    await wait()
    return mockResponse({
      ...currentStoredUser(),
      ...data,
      phone: data.phone ?? null,
      updated_at: new Date().toISOString(),
    }, 'Profile updated')
  },

  async changePassword() {
    await wait()
    return mockResponse(null, 'Password changed')
  },

  async uploadAvatar(file) {
    await wait()
    return mockResponse({
      ...currentStoredUser(),
      avatar_url: URL.createObjectURL(file),
      updated_at: new Date().toISOString(),
    }, 'Avatar updated')
  },

  async deleteAvatar() {
    await wait()
    return mockResponse({
      ...currentStoredUser(),
      avatar_url: null,
      updated_at: new Date().toISOString(),
    }, 'Avatar removed')
  },
}
