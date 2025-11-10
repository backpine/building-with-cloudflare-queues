# Building with Cloudflare Queues

[![Watch the video](https://img.youtube.com/vi/TWQv_tr5ABI/maxresdefault.jpg)](https://www.youtube.com/watch?v=TWQv_tr5ABI&t=1s)

A demonstration monorepo showcasing how to build resilient distributed systems using **Cloudflare Queues**. This project implements a producer-consumer architecture with AI-powered message processing and R2 event notifications.

## Overview

This project demonstrates key concepts of message queues:
- **Producers** send data to a queue and respond immediately
- **Consumers** process data asynchronously with retry logic
- **Event Subscriptions** trigger processing from Cloudflare services (R2, D1, etc.)
- **Dead Letter Queues** catch failed messages for later reprocessing

### Use Cases Demonstrated

1. **AI Message Processing**: User submits text → Queue → AI generates response → Display in UI
2. **Image Caption Generation**: User uploads image to R2 → Event notification → Queue → AI generates caption → Display in UI

## Architecture

This monorepo contains two applications:

### User Application
A **TanStack Start** frontend application (producer) that:
- Provides an input form for sending messages to the queue
- Uploads images to Cloudflare R2 storage
- Polls KV store to display processed results
- Runs on `http://localhost:3000`

### Data Service
A **Cloudflare Worker** backend (consumer) that:
- Consumes messages from the queue in batches
- Routes events to appropriate handlers using type-safe Zod schemas
- Processes messages with Cloudflare AI (Llama 2, LLaVA models)
- Stores results in Cloudflare KV for retrieval

### Shared Package
**data-ops**: Contains shared Zod schemas for type-safe queue messages

## Setup

```bash
# Install dependencies and build shared packages
pnpm run setup
```

### Prerequisites

You'll need to create these Cloudflare resources:

1. **Queue**: `queue-example` (main processing queue)
2. **Dead Letter Queue**: `catch-all-queue` (catches failed messages)
3. **R2 Bucket**: `queue-example` with event notifications configured
4. **KV Namespace**: `CACHE` (stores processed results)

Configure R2 event notifications to send `PutObject` events to `queue-example` queue.

## Development

### User Application (Producer)
```bash
pnpm run dev:user-application
```

Starts the TanStack Start application on port 3000.

### Data Service (Consumer)
```bash
pnpm run dev:data-service
```

Starts the Cloudflare Worker locally (connects to production queue with `remote: true`).

## Queue Configuration

### Producer Configuration
`apps/user-application/wrangler.jsonc`:
```jsonc
"queues": {
  "producers": [
    {
      "binding": "QUEUE",
      "queue": "queue-example",
      "remote": true  // Connect to production queue in dev
    }
  ]
}
```

### Consumer Configuration
`apps/data-service/wrangler.jsonc`:
```jsonc
"queues": {
  "consumers": [
    {
      "queue": "queue-example",
      "max_retries": 3,           // Retry failed messages 3 times
      "retry_delay": 2,           // Wait 2 seconds between retries
      "dead_letter_queue": "catch-all-queue",
      "max_batch_size": 4,        // Process up to 4 messages at once
      "max_batch_timeout": 1      // Wait 1 second to fill batch
    }
  ]
}
```

## Message Types

The project uses discriminated unions for type-safe message routing:

### Example Message
```typescript
{
  type: "EXAMPLE_MESSAGE",
  id: "uuid",
  message: "What is the meaning of life?"
}
```
Processed by Llama 2 AI model, response stored in KV.

### R2 Event
```typescript
{
  type: "R2_EVENT",
  account: "...",
  bucket: "queue-example",
  action: "PutObject",
  object: {
    key: "image.jpg",
    size: 12345,
    eTag: "..."
  }
}
```
Processed by LLaVA image-to-text model, caption stored in KV.

## Advanced Features

### Delayed Messages
```typescript
await env.QUEUE.send(message, { delaySeconds: 300 }); // 5 minute delay
```

### Manual Acknowledgment
```typescript
async queue(batch: MessageBatch) {
  for (const message of batch.messages) {
    try {
      await processMessage(message.body);
      message.ack(); // Acknowledge successful processing
    } catch (error) {
      message.retry(); // Retry this specific message
    }
  }
}
```

### Batch Operations
```typescript
async queue(batch: MessageBatch) {
  console.log(batch.queue); // Queue name
  batch.ackAll();   // Acknowledge all messages
  batch.retryAll(); // Retry all messages
}
```

## Deployment

### User Application
```bash
pnpm run deploy:user-application
```

### Data Service
```bash
pnpm run deploy:data-service
```

## Key Learnings

- **Cloudflare Queues only support one consumer per queue** (but unlimited producers)
- Use `remote: true` in wrangler config to test with production queues locally
- Run `pnpm wrangler types` to generate TypeScript bindings for Cloudflare resources
- Event subscriptions eliminate the need to update application code for common events
- Dead letter queues are essential for handling persistent failures

## Resources

- [Cloudflare Queues Documentation](https://developers.cloudflare.com/queues/)
- [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/getting-started)
- [Full Stack on Cloudflare Course](https://www.youtube.com/watch?v=TWQv_tr5ABI)
- [SaaS Kit Template](https://github.com/backpineai/saas-kit)
