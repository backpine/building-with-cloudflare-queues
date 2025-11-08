import { ExampleMessage, R2Event } from "@repo/data-ops/zod-schema/queue";
import { env } from "cloudflare:workers";

export async function processExampleMessage(event: ExampleMessage) {
  const ai = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
    prompt: event.message,
  });
  if (ai.response) {
    await env.CACHE.put(event.id, ai.response);
  }
}

export async function processR2Image(event: R2Event) {
  const file = await env.BUCKET.get(event.object.key);
  if (!file) {
    throw new Error(`File not found: ${event.object.key}`);
  }

  const image = await file.arrayBuffer();
  const input = {
    image: [...new Uint8Array(image)],
    prompt: "Generate a caption for this image",
    max_tokens: 512,
  };
  const response = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", input);
  await env.CACHE.put(event.object.key, response.description);
}
