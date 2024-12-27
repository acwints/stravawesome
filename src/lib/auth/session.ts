import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Session } from "next-auth";

export async function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function requireAuth(): Promise<Session> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getStravaToken(): Promise<string> {
  const session = await requireAuth();
  if (!session.user?.accessToken) {
    throw new Error('No Strava access token found');
  }
  return session.user.accessToken;
} 