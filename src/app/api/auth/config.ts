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
  debug: process.env.NEXTAUTH_DEBUG === 'true',
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
          select: {
            id: true, // Only select what we need for performance
          }
        });
        session.user.stravaConnected = !!stravaAccount;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Prevent open redirect vulnerability
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

      // Always return to dashboard for untrusted URLs
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  // Security improvements
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}; 