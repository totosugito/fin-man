import * as React from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { AuthContext, AuthProps } from '@/types/auth'
import {authClient} from "@/lib/auth-client";
import {useAppStore} from "@/stores/useAppStore";

const AuthContextTag = React.createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authStore = useAuthStore((state) => state)
  const appStore = useAppStore((state) => state)
  const [user, setUser] = React.useState<AuthProps | null>(authStore.user)

  const [loading, setLoading] = React.useState(true)
  const isAuthenticated = (!!user) && ((user?.token ?? "") !== "");

  const logout = React.useCallback(async () => {
    authStore.logout()
    appStore.resetAll();
    setUser(null)
  }, [])

  const login = React.useCallback(async (user: AuthProps) => {
    authStore.login(user)
    setUser(user)
  }, [])

  // On initial mount, fetch session
  React.useEffect(() => {
    (async () => {
      const {data: session} = await authClient.getSession()

      let userData: AuthProps = {token: null, user: null};
      if (session?.user && session?.session?.token) {
        userData = {
          token: session.session.token,
          user: session.user
        }

        authStore.login(userData)
        setUser(userData)
      } else {
        authStore.logout()
        appStore.resetAll();
        setUser(null)
      }

      setLoading(false)
    })()
  }, [])

  // const value = React.useMemo(() => ({
  //   isAuthenticated,
  //   user,
  //   login,
  //   logout,
  // }), [isAuthenticated, user, login, logout])

  if (loading) return null

  return (
    <AuthContextTag.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContextTag.Provider>
  )
}

export { AuthContextTag }
