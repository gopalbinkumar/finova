import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export function initializeCsrf() {
  return axios.get('/sanctum/csrf-cookie', {
    withCredentials: true,
    withXSRFToken: true,
  })
}

export function mockResponse(data, message = 'OK') {
  return Promise.resolve({
    data: {
      success: true,
      message,
      data,
    },
  })
}

export function getErrorMessage(error) {
  if (error?.response?.data?.errors) {
    const firstKey = Object.keys(error.response.data.errors)[0]
    return error.response.data.errors[firstKey][0]
  }
  if (error?.response?.data?.message) return error.response.data.message
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan. Silakan coba lagi.'
}
