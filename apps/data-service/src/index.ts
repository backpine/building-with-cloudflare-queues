import { WorkerEntrypoint } from "cloudflare:workers";
import { app } from "@/hono/app";
import { queueMessageSchema } from "@repo/data-ops/zod-schema/queue";
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
      const parsedMessage = queueMessageSchema.safeParse(message.body);
      if (!parsedMessage.success) {
        console.error("Invalid message:", parsedMessage.error);
        // handle invalid message
        continue;
      }
      if (parsedMessage.data.type === "EXAMPLE_MESSAGE") {
        await processExampleMessage(parsedMessage.data);
      } else if (parsedMessage.data.type === "R2_EVENT") {
        await processR2Image(parsedMessage.data);
      }
    }
  }
}
