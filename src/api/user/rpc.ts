import { action, cache, redirect } from "@solidjs/router";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/drizzle";
import { userTable } from "../../db/schema";
import { ROUTE_LOGGED_IN, ROUTE_LOGIN, ROUTE_PUBLIC } from "~/lib/route";
import { getSession, getSessionUserId } from "./auth";

const SANITIZED_USER_FIELDS = {
  id: userTable.id,
  username: userTable.username,
  role: userTable.role,
};

export const getUser = cache(async () => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }
  const [row] = await db
    .select(SANITIZED_USER_FIELDS)
    .from(userTable)
    .where(eq(userTable.id, userId));
  if (!row) {
    throw redirect(ROUTE_LOGIN);
  }
  return row;
}, "user");

export const redirectIfLoggedIn = cache(async () => {
  "use server";
  const userId = await getSessionUserId();
  if (userId) {
    throw redirect(ROUTE_LOGGED_IN);
  }
  return null;
}, "loggedIn");

const loginFormSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const loginAction = action(async (formData: FormData) => {
  "use server";
  const form = loginFormSchema.parse(Object.fromEntries(formData.entries()));

  try {
    const [row] = await db
      .select(SANITIZED_USER_FIELDS)
      .from(userTable)
      .where(
        and(
          eq(userTable.username, form.username),
          eq(userTable.password, form.password)
        )
      );
    if (!row) {
      throw new Error("Invalid credentials");
    }
    const session = await getSession();
    await session.update((user) => ((user.userId = row.id), user));
    throw redirect(ROUTE_LOGGED_IN);
  } catch (err) {
    throw err as Error;
  }
});

export const logoutAction = action(async () => {
  "use server";
  console.log("logout action");
  const session = await getSession();
  await session.update((user) => (user.userId = undefined));
  throw redirect(ROUTE_PUBLIC);
});
