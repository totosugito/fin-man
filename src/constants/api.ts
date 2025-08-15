const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL
const APP_URL_V1 = APP_BASE_URL + "/api/v1"
export const AppApi = {
  auth: {
    login: APP_BASE_URL + "/api/auth/sign-in-email",
    logout: APP_URL_V1 + "/user/logout",
  },
  admin: {
    user: {
      list: APP_BASE_URL + "/api/admin/user/list",
      delete: APP_URL_V1 + "/admin/user/delete",
      create: APP_URL_V1 + "/admin/user/add",
      update: APP_URL_V1 + "/admin/user/update",
      changePassword: APP_URL_V1 + "/admin/user/change-password",
      crud: APP_URL_V1 + "/admin/user",
    }
  },
}

export const AppRoute = {
  dashboard: {
    dashboard: "/",
  },
  project: {
    list: "/project",
  },
  admin: {
    user: {
      list: "/admin/users",
    }
  },
}