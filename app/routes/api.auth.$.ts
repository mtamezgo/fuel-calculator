import { auth } from "~/lib/auth";
import type { Route } from "./+types/api.auth.$";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    return await auth.handler(request);
  } catch (error) {
    console.error("Auth loader error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function action({ request }: Route.ActionArgs) {
  try {
    return await auth.handler(request);
  } catch (error) {
    console.error("Auth action error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
