import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

export function getErrorMessage(error) {
  const response = error?.response;
  const data = response?.data;

  if (data?.errors) {
    const firstError = Object.values(data.errors)?.[0];

    if (Array.isArray(firstError)) {
      return firstError[0];
    }

    return firstError;
  }

  if (data?.message) {
    return data.message;
  }

  if (response?.status === 401) {
    return 'Email atau password tidak sesuai.';
  }

  if (response?.status === 419) {
    return 'Sesi keamanan telah kedaluwarsa. Silakan coba lagi.';
  }

  return 'Terjadi kesalahan. Silakan coba lagi.';
}

async function getCsrfCookie() {
  await api.get('/sanctum/csrf-cookie');
}

export function useRegister() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      await getCsrfCookie();

      const response = await api.post('/api/auth/register', payload);

      return response.data.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      navigate('/dashboard', { replace: true });
    },
  });
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      await getCsrfCookie();

      const response = await api.post('/api/auth/login', payload);

      return response.data.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      navigate('/dashboard', { replace: true });
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/api/auth/me');

      return response.data.data.user;
    },
    retry: false,
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}