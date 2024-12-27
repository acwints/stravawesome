import NextAuth, { DefaultSession, NextAuthOptions, Session } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import StravaProvider, { StravaProfile } from "next-auth/providers/strava";
import { AuthError } from "@/lib/api/errors";

// Create a singleton instance of PrismaClient
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_URL_NON_POOLING
      }
    }
  });
} else {
  // In development, use a global variable to prevent multiple instances
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_URL_NON_POOLING
        }
      }
    });
  }
  prisma = (global as any).prisma;
}

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

async function refreshAccessToken(token: any) {
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

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new AuthError('Failed to refresh access token');
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
        access_token: refreshedTokens.access_token,
        refresh_token: refreshedTokens.refresh_token,
        expires_at: refreshedTokens.expires_at,
      },
    });

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token,
      expiresAt: refreshedTokens.expires_at,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    
    // Clear the token to force a new sign in
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      expiresAt: undefined,
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        url: "https://www.strava.com/oauth/authorize",
        params: {
          scope: "read,activity:read_all,profile:read_all,profile:write,activity:write",
          approval_prompt: "auto",
          response_type: "code",
        },
      },
      token: {
        url: "https://www.strava.com/oauth/token",
        async request({ client, params, checks, provider }) {
          const response = await client.oauthCallback(
            provider.callbackUrl,
            params,
            checks,
            {
              exchangeBody: {
                client_id: provider.clientId,
                client_secret: provider.clientSecret,
                grant_type: "authorization_code",
              },
            }
          );
          return { tokens: response };
        },
      },
      userinfo: {
        url: "https://www.strava.com/api/v3/athlete",
        async request({ tokens, client }) {
          const profile = await client.userinfo(tokens.access_token as string);
          return profile;
        },
      },
      profile(profile: StravaProfile) {
        return {
          id: profile.id.toString(),
          name: `${profile.firstname} ${profile.lastname}`,
          email: undefined,
          image: profile.profile,
        };
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
    async session({ session, token }): Promise<Session> {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.stravaId = token.stravaId as string;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
        session.user.expiresAt = token.expiresAt as number;

        // If token is missing required fields, force re-authentication
        if (!session.user.accessToken || !session.user.refreshToken) {
          throw new AuthError('Session expired. Please sign in again.');
        }
      }
      return session;
    },
    async jwt({ token, account }) {
      try {
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
        const refreshedToken = await refreshAccessToken(token);
        
        // If refresh failed, force re-authentication
        if (!refreshedToken.accessToken) {
          throw new AuthError('Session expired. Please sign in again.');
        }

        return refreshedToken;
      } catch (error) {
        // Clear the token to force a new sign in
        return {
          ...token,
          accessToken: undefined,
          refreshToken: undefined,
          expiresAt: undefined,
        };
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 