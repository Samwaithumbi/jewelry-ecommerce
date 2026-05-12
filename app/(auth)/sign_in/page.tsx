"use client"

import { signIn, signOut, useSession } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()
  console.log(process.env.NEXTAUTH_URL)
  return (
    <main>
      {session ? (
        <>
          <h1>Welcome {session.user?.name}</h1>

          <img
            src={session.user?.image ?? ""}
            alt=""
            width={50}
          />

          <button onClick={() => signOut()}>
            Logout
          </button>
        </>
      ) : (
        <button onClick={() => signIn("google")}>
          Sign in with Google
        </button>
      )}
    </main>
  )
}