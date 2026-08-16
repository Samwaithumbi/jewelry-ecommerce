import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const getCartSessionId = async () => {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
        return session.user.id as string;
    }

    const cookieStore = await cookies();
    const guestSessionCookie = cookieStore.get("guest_session");

    if (guestSessionCookie) {
        return guestSessionCookie.value;
    }

    const newSessionId = crypto.randomUUID();
    
    try {
        cookieStore.set("guest_session", newSessionId, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });
    } catch (error) {
        // Ignored, might be called from Server Component
    }

    return newSessionId;
};
