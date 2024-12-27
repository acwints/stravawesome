import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import StravaProvider, { StravaProfile } from "next-auth/providers/strava";

const prisma = new PrismaClient();

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      stravaId?: string | null;
      accessToken?: string;
    } & DefaultSession["user"]
  }
}

const config: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read,activity:read_all,profile:read_all",
        },
      },
      profile(profile: StravaProfile) {
        return {
          id: profile.id.toString(),
          name: `${profile.firstname} ${profile.lastname}`,
          email: undefined,
          image: profile.profile,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.stravaId = token.stravaId as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.stravaId = account.providerAccountId;
      }
      return token;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
};

const handler = NextAuth(config);

export { handler as GET, handler as POST }; 