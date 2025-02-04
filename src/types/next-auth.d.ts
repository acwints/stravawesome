import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      stravaConnected: boolean;
    } & DefaultSession["user"]
    expires: string
  }
} 