import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

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
  return 'The demo action could not be completed.'
}
