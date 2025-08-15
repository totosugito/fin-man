import AppLogo from "@/assets/app/well-perfo.png";
export const APP_CONFIG = {
  prefixStore: "fin-mot",
  isDev: false,
  dayFormat: "yyyy-MM-dd",
  app: {
    name: "FinMon",
    description: "Financial Monitoring",
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