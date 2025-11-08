import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";
const baseFunction = createServerFn();

const ExampleMessageDataSchema = z.object({
  message: z.string().min(1),
  id: z.string(),
});

type ExampleMessageData = z.infer<typeof ExampleMessageDataSchema>;

export const sendDataToQueue = baseFunction
  .inputValidator((data: ExampleMessageData) =>
    ExampleMessageDataSchema.parse(data),
  )
  .handler(async (ctx) => {
    await env.QUEUE.send({
      id: ctx.data.id,
      message: ctx.data.message,
    });
    return ctx.data.id;
  });

export const getProcessedQueueMessage = baseFunction
  .inputValidator((id: string) => {
    return id;
  })
  .handler(async (ctx) => {
    return await env.CACHE.get(ctx.data);
  });
