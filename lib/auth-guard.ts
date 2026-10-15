/**
 * lib/auth-guard.ts
 * 
 * Shared server-side authorization helpers.
 * Import these in every server action or API route that requires authentication.
 */

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { users } from "@/drizzle/src/db/schema"
import { eq } from "drizzle-orm"

/**
 * Returns the current session or throws an error if the user is not
 * authenticated. Use in server actions to require login.
 */
export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("UNAUTHORIZED: You must be signed in")
  }
  return session
}

/**
 * Returns the current session or throws an error if the user is not an admin.
 * Authoritatively verifies against PostgreSQL to guarantee that manipulated
 * JWT tokens or stale sessions cannot grant administrator privileges.
 */
export async function requireAdminSession() {
  const session = await requireSession()
  const userId = session.user?.id
  if (!userId) {
    throw new Error("FORBIDDEN: Admin access required")
  }

  // Authoritative database check
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });

  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("FORBIDDEN: Admin access required")
  }

  return session
}
