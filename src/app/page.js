'use client';

import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main style={{ padding: "20px", textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to Stravawesome</h1>
      <button onClick={() => signIn("google")} style={{ marginTop: "20px" }}>
        Sign in with Google
      </button>
    </main>
  );
} 