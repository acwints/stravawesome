import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import StravaProvider, { StravaProfile } from "next-auth/providers/strava";

// Create a new PrismaClient instance with connection pooling disabled
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL_NON_POOLING
    }
  }
});

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      stravaId?: string | null;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read,activity:read_all,profile:read_all",
          approval_prompt: "force", // Force re-approval to get fresh tokens
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
    async signIn({ user, account, profile }) {
      try {
        if (!account || !profile) {
          return false;
        }

        const stravaProfile = profile as StravaProfile;
        
        // Store the user and their tokens
        await prisma.user.upsert({
          where: { 
            stravaId: stravaProfile.id.toString(),
          },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            name: user.name,
            image: user.image,
            stravaId: stravaProfile.id.toString(),
          },
        });

        // Store the account separately to avoid nested upsert issues
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: 'strava',
              providerAccountId: stravaProfile.id.toString(),
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
          },
          create: {
            userId: user.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
          },
        });

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.stravaId = token.stravaId as string;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
        session.user.expiresAt = token.expiresAt as number;
      }
      return session;
    },
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.stravaId = account.providerAccountId;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number * 1000)) {
        return token;
      }

      // Access token has expired, try to refresh it
      try {
        const response = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken,
          }),
        });

        const tokens = await response.json();

        if (!response.ok) {
          console.error('Token refresh failed:', tokens);
          throw tokens;
        }

        // Update the token in the database
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: 'strava',
              providerAccountId: token.stravaId as string,
            },
          },
          data: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at,
          },
        });

        return {
          ...token,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_at,
        };
      } catch (error) {
        console.error('Error refreshing access token', error);
        // Return token without error to prevent infinite loops
        return token;
      }
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 