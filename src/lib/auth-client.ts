import { createAuthClient } from "better-auth/react"

const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL
export const authClient = createAuthClient({
  baseURL: APP_BASE_URL, // The base URL of your auth server
  fetcher: async (url: any, options: any) => {
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  },
  // session: {
  //   cookieCache: {
  //     enabled: true,
  //     maxAge: 60 // Cache duration in seconds
  //   }
  // }
})