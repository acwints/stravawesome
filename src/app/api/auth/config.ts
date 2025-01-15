import { type Session, type DefaultSession, type NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { AdapterUser } from "@auth/core/adapters"
import StravaProvider from 'next-auth/providers/strava';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      stravaConnected: boolean;
    } & DefaultSession['user']
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'read,activity:read_all,profile:read_all' },
      },
    }),
  ],
  callbacks: {
    async session({ session, user, token }: { 
      session: Session; 
      user: AdapterUser; 
      token: JWT; 
    }) {
      if (session.user) {
        session.user.id = user.id;
        const stravaAccount = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: 'strava',
          },
        });
        session.user.stravaConnected = !!stravaAccount;
      }
      return session;
    },
  },
  session: {
    strategy: "database" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
}; 