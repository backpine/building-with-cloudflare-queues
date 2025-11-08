import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

export const Route = createFileRoute("/api/images/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { id } = params;
        const image = await env.BUCKET.get(id);
        if (!image) {
          throw new Error("Image not found");
        }
        return new Response(await image.arrayBuffer());
      },
    },
  },
});
