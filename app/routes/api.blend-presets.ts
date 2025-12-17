import { auth } from "~/lib/auth";
import { db } from "~/db";
import { blendPresets } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/api.blend-presets";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPresets = await db
    .select()
    .from(blendPresets)
    .where(eq(blendPresets.userId, session.user.id))
    .orderBy(blendPresets.createdAt);

  return Response.json(userPresets);
}

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const method = request.method;

  if (method === "POST") {
    const data = await request.json();
    const { name, products = [] } = data;

    if (!name) {
      return Response.json({ error: "Preset name is required" }, { status: 400 });
    }

    const [preset] = await db
      .insert(blendPresets)
      .values({
        userId: session.user.id,
        name,
        products,
      })
      .returning();

    return Response.json(preset, { status: 201 });
  }

  if (method === "PUT") {
    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) {
      return Response.json({ error: "Preset ID is required" }, { status: 400 });
    }

    const [preset] = await db
      .update(blendPresets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blendPresets.id, id))
      .returning();

    return Response.json(preset);
  }

  if (method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Preset ID is required" }, { status: 400 });
    }

    await db.delete(blendPresets).where(eq(blendPresets.id, id));

    return Response.json({ message: "Preset deleted successfully" });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
