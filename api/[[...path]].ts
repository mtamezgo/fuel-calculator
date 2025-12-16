import { createRequestHandler } from "@react-router/node";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// @ts-expect-error - build is generated at build time
import * as build from "../build/server/index.js";

const handler = createRequestHandler({ build });

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
