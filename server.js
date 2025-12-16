import { createRequestHandler } from "@react-router/node";
import * as build from "./build/server/index.js";

const handler = createRequestHandler({ build });

export default async function (req, res) {
  return handler(req, res);
}
