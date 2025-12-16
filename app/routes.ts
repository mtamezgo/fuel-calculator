import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("api/presets", "routes/api.presets.ts"),
  route("api/gas-prices", "routes/api.gas-prices.ts"),
] satisfies RouteConfig;
