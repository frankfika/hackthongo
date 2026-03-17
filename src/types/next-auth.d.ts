import { DefaultSession, DefaultUser } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      portal?: "admin" | "judge" | "general"
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    portal?: "admin" | "judge" | "general"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    portal?: "admin" | "judge" | "general"
  }
}
