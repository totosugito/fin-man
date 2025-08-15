import AppLogo from "@/assets/app/logo.png";
export const APP_CONFIG = {
  prefixStore: "fin-man",
  isDev: false,
  dayFormat: "yyyy-MM-dd",
  app: {
    name: "FinMan",
    description: "Financial Management",
    logo: AppLogo,
    version: "1.0.0",
  },
  demoUser: {
    email: "",
    password: "",
  },
  path: {
    defaultPublic: "/login",
    defaultPrivate: "/project",
  }
}