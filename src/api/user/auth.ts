import { useSession } from "vinxi/http";

type UserSession = {
  userId?: string;
};

// const secret = process.env.SESSION_SECRET || "default_session_secret_longggggg";
// if (secret === "default_session_secret_longggggg") {
//   console.warn(
//     "🚨 No SESSION_SECRET environment variable set, using default. The app is insecure in production."
//   );
// }

// assertSessionSecret(secret);

function assertSessionSecret(secret?: string): asserts secret is string {
  if (!secret || typeof secret !== "string") {
    throw new Error("Invalid session secret");
  }
  if (secret.length < 32) {
    throw new Error(`Invalid session secret, min 32 length`);
  }
}

export function getSession() {
  assertSessionSecret(process.env.SESSION_SECRET);

  return useSession<UserSession>({
    password: process.env.SESSION_SECRET,
  });
}

export async function getSessionUserId() {
  const session = await getSession();
  const userId = session.data.userId;
  if (!userId) return null;
  return userId;
}
