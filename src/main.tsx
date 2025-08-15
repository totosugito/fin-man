import React from 'react'
import ReactDOM from 'react-dom/client'
import {RouterProvider, createRouter} from '@tanstack/react-router'

import {routeTree} from './routeTree.gen'
import './assets/styles.css'
import {useAuth} from "@/hooks/use-auth";
import {AuthProvider} from "@/lib/auth-context";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Toaster} from "@/components/ui/sonner";
import './i18n';
import {Theme, ThemeProvider} from "@/lib/theme-provider";
import {useAuthStore} from "@/stores/useAuthStore";
import NotFoundError from "@/components/custom/errors/NotFoundError";

// Register things for typesafety
// declare module '@tanstack/react-router' {
//   interface Register {
//     router: typeof router
//   }
//
//   interface RouteContext {
//     auth: ReturnType<typeof useAuth>
//     queryClient: QueryClient
//   }
// }

// Set up a Router instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  context: {
    auth: undefined!,
  },
  defaultNotFoundComponent: NotFoundError,
})

function InnerApp() {
  const auth = useAuth()
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{auth}}/>
    </QueryClientProvider>)
}

function App() {
  const theme = useAuthStore((state) => state?.theme ?? "light");
  return (
    <ThemeProvider defaultTheme={theme as Theme} attribute="class">
      <AuthProvider>
        <InnerApp/>
      </AuthProvider>
    </ThemeProvider>
  )
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <div>
      <App/>
      <Toaster />
    </div>,
  )
}
