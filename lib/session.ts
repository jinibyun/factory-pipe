import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE, type SessionPayload } from "./auth";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
