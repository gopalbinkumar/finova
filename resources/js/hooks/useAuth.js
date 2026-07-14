import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/api';
const AUTH_QUERY_KEY = ['auth', 'me'];
export { getErrorMessage };
export function useLogin() {
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data) => authService.login(data),
        onSuccess: ({ data }) => {
            setAuth(data.data.user);
            navigate('/dashboard');
        },
    });
}
export function useRegister() {
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data) => authService.register(data),
        onSuccess: ({ data }) => {
            setAuth(data.data.user);
            navigate('/dashboard');
        },
    });
}
export function useLogout() {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => authService.logout(),
        onSettled: () => {
            logout();
            qc.clear();
            navigate('/login');
        },
    });
}
export function useMe() {
    const { user, isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: () => authService.me().then((r) => r.data.data.user),
        enabled: isAuthenticated,
        initialData: user,
    });
}
export function useForgotPassword() {
    return useMutation({
        mutationFn: (data) => authService.forgotPassword(data),
    });
}
export function useResetPassword() {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data) => authService.resetPassword(data),
        onSuccess: () => {
            navigate('/login?reset=1');
        },
    });
}
export function useUpdateProfile() {
    const { setUser } = useAuthStore();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => authService.updateProfile(data),
        onSuccess: ({ data }) => {
            const user = data.data.user ?? data.data;
            setUser(user);
            qc.setQueryData(AUTH_QUERY_KEY, user);
        },
    });
}
export function useChangePassword() {
    return useMutation({
        mutationFn: (data) => authService.changePassword(data),
    });
}
export function useUploadAvatar() {
    const { setUser } = useAuthStore();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file) => authService.uploadAvatar(file),
        onSuccess: ({ data }) => {
            const user = data.data.user ?? data.data;
            setUser(user);
            qc.setQueryData(AUTH_QUERY_KEY, user);
        },
    });
}
export function useDeleteAvatar() {
    const { setUser } = useAuthStore();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => authService.deleteAvatar(),
        onSuccess: ({ data }) => {
            const user = data.data.user ?? data.data;
            setUser(user);
            qc.setQueryData(AUTH_QUERY_KEY, user);
        },
    });
}
