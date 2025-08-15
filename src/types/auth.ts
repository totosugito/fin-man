import {SubmitHandler} from "react-hook-form";

export type LoginFormValues = {
  email: string
  password: string,
}

export type LoginProps = {
  onFormSubmit: SubmitHandler<LoginFormValues>
}

export type AuthProps = {
  token?: string | null
  user: {
    id: string;
    name: string;
    emailVerified: boolean;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null | undefined;
    role?: string
  } | null
}

export interface AuthContext {
  isAuthenticated: boolean
  login: (user: AuthProps) => Promise<void>
  logout: () => Promise<void>
  user: AuthProps | null
}