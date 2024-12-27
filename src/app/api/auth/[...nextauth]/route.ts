import NextAuth, { DefaultSession, Account, Profile, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import StravaProvider, { StravaProfile } from "next-auth/providers/strava";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      stravaId?: string | null;
      accessToken?: string;
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
        },
      },
      profile(profile: StravaProfile) {
        console.log("[next-auth][debug][profile]", { profile });
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
      console.log("[next-auth][debug][signIn] Starting signIn callback", { user, account });
      
      try {
        if (!account || !profile) {
          console.error("[next-auth][error] Missing account or profile in signIn callback");
          return false;
        }

        const stravaProfile = profile as StravaProfile;
        
        // Create or update user first
        console.log("[next-auth][debug][signIn] Upserting user");
        const dbUser = await prisma.user.upsert({
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

        console.log("[next-auth][debug][signIn] User upserted", { dbUser });

        // Then ensure the account is linked
        console.log("[next-auth][debug][signIn] Upserting account");
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
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
            userId: dbUser.id,
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

        console.log("[next-auth][debug][signIn] Account upserted");
        return true;
      } catch (error) {
        console.error("[next-auth][error] Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
      console.log("[next-auth][debug][session] Starting session callback", { session, token });
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.stravaId = token.stravaId as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      console.log("[next-auth][debug][jwt] Starting jwt callback", { token, account, user });
      if (account) {
        token.accessToken = account.access_token;
        token.stravaId = account.providerAccountId;
      }
      if (user) {
        token.id = user.id;
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
  logger: {
    error(code, ...message) {
      console.error("[next-auth][error]", code, message);
    },
    warn(code, ...message) {
      console.warn("[next-auth][warn]", code, message);
    },
    debug(code, ...message) {
      console.debug("[next-auth][debug]", code, message);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 