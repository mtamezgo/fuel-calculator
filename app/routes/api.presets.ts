import { auth } from "~/lib/auth";
import { db } from "~/db";
import { presets } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/api.presets";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPresets = await db
    .select()
    .from(presets)
    .where(eq(presets.userId, session.user.id))
    .orderBy(presets.createdAt);

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
    const {
      name,
      exchangeRate = 0,
      basePrice = 0,
      gallons = 0,
      liters = 0,
      margin = 0,
      marginInputType = "mxnLtr",
      concepts = [],
    } = data;

    if (!name) {
      return Response.json({ error: "Preset name is required" }, { status: 400 });
    }

    const [preset] = await db
      .insert(presets)
      .values({
        userId: session.user.id,
        name,
        exchangeRate,
        basePrice,
        gallons,
        liters,
        margin,
        marginInputType,
        concepts,
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
      .update(presets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presets.id, id))
      .returning();

    return Response.json(preset);
  }

  if (method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Preset ID is required" }, { status: 400 });
    }

    await db.delete(presets).where(eq(presets.id, id));

    return Response.json({ message: "Preset deleted successfully" });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
