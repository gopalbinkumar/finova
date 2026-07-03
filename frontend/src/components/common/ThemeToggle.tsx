import { Moon, Sun, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('finova_theme') as Theme) ?? 'system'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen to system preference changes
  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (t: Theme) => {
    localStorage.setItem('finova_theme', t)
    setThemeState(t)
    applyTheme(t)
  }

  return { theme, setTheme }
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const cycle: Theme[] = ['light', 'dark', 'system']
  const next = cycle[(cycle.indexOf(theme) + 1) % cycle.length]

  const icons: Record<Theme, React.ReactNode> = {
    light: <Sun size={18} />,
    dark: <Moon size={18} />,
    system: <Monitor size={18} />,
  }

  const labels: Record<Theme, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Switch to ${labels[next]} mode`}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        bg-muted hover:bg-border text-muted-foreground hover:text-foreground
        transition-all duration-200
        ${className}
      `}
    >
      {icons[theme]}
      <span className="hidden sm:inline">{labels[theme]}</span>
    </button>
  )
}
