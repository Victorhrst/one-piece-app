import handler from "vinext/server/fetch-handler";

// The Wiki uses native Worker bindings (D1) directly. Connector request context
// is unnecessary here and would couple the application worker to the preview
// connector service.
export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx);
  },
};
