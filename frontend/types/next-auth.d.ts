import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken: string
    user: {
      role: string
      stationName: string
    } & DefaultSession["user"]
  }
  interface User {
    accessToken: string
    role: string
    stationName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string
    role: string
    stationName: string
  }
}
