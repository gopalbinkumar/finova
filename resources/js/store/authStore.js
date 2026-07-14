import { create } from 'zustand'

const applyThemePreference = (theme) => {
  if (typeof window === 'undefined') return

  const preference = theme || 'system'
  localStorage.setItem('finova_theme', preference)

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle(
    'dark',
    preference === 'dark' || (preference === 'system' && prefersDark),
  )
}

const applyUserPreferences = (user) => {
  if (user?.theme) applyThemePreference(user.theme)
}

export const useAuthStore = create()((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user) => {
    applyUserPreferences(user)
    set({ user, isAuthenticated: true, isInitialized: true })
  },
  setUser: (user) => {
    applyUserPreferences(user)
    set({ user })
  },
  setGuest: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
  logout: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
}))
