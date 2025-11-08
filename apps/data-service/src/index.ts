import { WorkerEntrypoint } from "cloudflare:workers";
import { app } from "@/hono/app";
import {
  exampleMessageSchema,
  queueMessageSchema,
} from "@repo/data-ops/zod-schema/queue";
import {
  processExampleMessage,
  processR2Image,
} from "./handlers/process-message";

export default class DataService extends WorkerEntrypoint<Env> {
  fetch(request: Request) {
    return app.fetch(request, this.env, this.ctx);
  }
  async queue(batch: MessageBatch<unknown>) {
    for (const message of batch.messages) {
      const data = queueMessageSchema.parse(message.body);
      if (data.type === "EXAMPLE_MESSAGE") {
        await processExampleMessage(data);
      } else if (data.type === "R2_EVENT") {
        await processR2Image(data);
      }
    }
  }
}
