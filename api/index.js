import { createRequestHandler } from "@react-router/node";
import * as build from "../build/server/index.js";

// Create the request handler once
const handler = createRequestHandler({ build });

export default handler;
