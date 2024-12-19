import {
  RouteDefinition,
  RouteSectionProps,
  useSubmission,
} from "@solidjs/router";
import { Show } from "solid-js";
import { loginAction, redirectIfLoggedIn } from "~/api/user/rpc";
import { LockIcon } from "~/components/icons/LockIcon";
import { UserIcon } from "~/components/icons/UserIcon";
import { Button } from "~/components/ui/button";
import { TextField, TextFieldInput } from "~/components/ui/text-field";

export const route = {
  preload: () => redirectIfLoggedIn(),
} satisfies RouteDefinition;

export default function LoginPage(props: RouteSectionProps) {
  const loggingIn = useSubmission(loginAction);

  return (
    <div class="flex h-screen bg-white">
      {/* Right Panel */}
      <div class="w-full p-8 lg:p-24 flex flex-col justify-center items-center">
        <div class="max-w-sm w-full">
          <h1 class="text-3xl font-bold mb-2">Login to your account</h1>
          <p class="text-gray-600 mb-8">
            Enter your username below to login to your account
          </p>

          <form action={loginAction} method="post">
            <input
              type="hidden"
              name="redirectTo"
              value={props.params.redirectTo ?? "/dashboard"}
            />
            <TextField class="space-y-4 mb-4">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon class="w-4 h-4 text-gray-400" />
                </div>
                <TextFieldInput
                  type="text"
                  name="username"
                  placeholder="Username"
                  class="pl-10 text-base"
                  required
                  minLength={1}
                />
              </div>
            </TextField>
            <TextField class="space-y-4 mb-4">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon class="w-4 h-4 text-gray-400" />
                </div>
                <TextFieldInput
                  type="password"
                  name="password"
                  placeholder="Password"
                  class="pl-10 text-base"
                  required
                  minLength={1}
                />
              </div>
            </TextField>
            <Button
              type="submit"
              class="w-full bg-black text-white hover:bg-gray-800"
            >
              {loggingIn.pending ? "Logging in..." : "Login"}
            </Button>
            <Show when={loggingIn.error}>
              <div class="text-red-500 text-center" role="alert">
                {loggingIn.error!.message}
              </div>
            </Show>
          </form>
        </div>
      </div>
    </div>
  );
}
