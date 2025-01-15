'use client';

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const { data: session } = useSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main style={{ padding: "20px", textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome, {session.user?.name}!</h1>
      <button onClick={() => signOut()} style={{ marginTop: "20px" }}>
        Sign Out
      </button>
    </main>
  );
} 