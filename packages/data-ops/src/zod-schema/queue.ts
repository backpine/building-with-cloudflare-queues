import { z } from "zod";

export const exampleMessageSchema = z.object({
  type: z.literal("EXAMPLE_MESSAGE").default("EXAMPLE_MESSAGE"),
  id: z.string(),
  message: z.string().min(1),
});

export type ExampleMessage = z.infer<typeof exampleMessageSchema>;

export const r2EventSchema = z.object({
  type: z.literal("R2_EVENT").default("R2_EVENT"),
  account: z.string(),
  bucket: z.string(),
  eventTime: z.string(),
  action: z.literal("PutObject"),
  object: z.object({
    key: z.string(),
    size: z.number(),
    eTag: z.string(),
  }),
});

export type R2Event = z.infer<typeof r2EventSchema>;

export const queueMessageSchema = z.union([
  exampleMessageSchema,
  r2EventSchema,
]);

export type QueueMessage = z.infer<typeof queueMessageSchema>;
