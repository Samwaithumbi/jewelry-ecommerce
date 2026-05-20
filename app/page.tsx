"use client"

import {  signOut } from "next-auth/react";

export default function Home() {
  return (
   <div>
      <h1>Maison Doree</h1>
      <button onClick={() => signOut({ callbackUrl: '/sign_in' })}>Sign out</button>
   </div> 
  );
}
