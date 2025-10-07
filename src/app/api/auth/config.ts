import { type NextAuthOptions } from "next-auth"
import StravaProvider from 'next-auth/providers/strava';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const providers: NextAuthOptions['providers'] = [];

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

providers.push(
  StravaProvider({
    clientId: process.env.STRAVA_CLIENT_ID!,
    clientSecret: process.env.STRAVA_CLIENT_SECRET!,
    authorization: {
      params: { scope: 'read,activity:read_all,profile:read_all' },
    },
  })
);

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== 'production',
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    async session({ session, user }) {
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      try {
        const parsed = new URL(url);
        if (parsed.origin === new URL(baseUrl).origin) {
          return url;
        }
      } catch {
        return `${baseUrl}/dashboard`;
      }

      return `${baseUrl}/dashboard`;
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