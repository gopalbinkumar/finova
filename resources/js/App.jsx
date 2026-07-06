import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from '@/routes';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
// Initialize theme before render
function initTheme() {
    const saved = localStorage.getItem('finova_theme') ?? 'dark';
    const root = document.documentElement;
    if (saved === 'dark') {
        root.classList.add('dark');
    }
    else if (saved === 'light') {
        root.classList.remove('dark');
    }
    else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
    }
}
initTheme();
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
    },
});
// ─── Demo: auto-login with mock user ─────────────────────────────────────────
function AuthInit() {
    const { setAuth, setGuest } = useAuthStore();
    useEffect(() => {
        let active = true;

        authService.me()
            .then(({ data }) => active && setAuth(data.data.user))
            .catch(() => active && setGuest());

        return () => {
            active = false;
        };
    }, [setAuth, setGuest]);
    return null;
}
function App() {
    useEffect(() => {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const saved = localStorage.getItem('finova_theme') ?? 'dark';
            if (saved === 'system') {
                document.documentElement.classList.toggle('dark', mql.matches);
            }
        };
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);
    return (<QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInit />
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>);
}
export default App;
