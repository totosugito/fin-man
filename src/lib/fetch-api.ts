import axios from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'
import {APP_CONFIG} from "@/constants/config";

export const axiosInstance = axios.create({})

// Add interceptor for handling 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth store (you can import directly or trigger a logout function)
      const authStore = useAuthStore.getState()
      authStore.logout()

      // Redirect to public page
      window.location.href = APP_CONFIG.path.defaultPublic
    }

    return Promise.reject(error)
  }
)

export const fetchApi = async ({
                                 method,
                                 url,
                                 body,
                                 headers,
                                 params,
                                 withCredentials = true,
                               }: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  body?: any
  headers?: Record<string, string>
  params?: Record<string, any>
  withCredentials?: boolean
}) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data: body ?? null,
      // headers: headers ?? {},
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {}),
      },
      params: params ?? {},
      withCredentials
    })
    return response.data
  } catch (error) {
    throw error
  }
}
