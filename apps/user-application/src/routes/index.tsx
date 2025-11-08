import { createFileRoute } from "@tanstack/react-router";
import { NavigationBar } from "@/components/navigation";
import { QueueDemo } from "@/components/queue";
import { ImageUpload } from "@/components/upload";
import { env } from "cloudflare:workers";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
          return new Response(
            JSON.stringify({ error: "No file provided" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const key = crypto.randomUUID();
        await env.BUCKET.put(key, file);

        return new Response(
          JSON.stringify({ key, url: `/api/images/${key}` }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <main className="container mx-auto px-4 py-16 space-y-24">
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Cloudflare Queues Demo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Submit a message to the queue and watch it get processed in
              real-time
            </p>
          </div>
          <QueueDemo />
        </section>

        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              R2 Image Upload
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload images to Cloudflare R2 storage
            </p>
          </div>
          <ImageUpload />
        </section>
      </main>
    </div>
  );
}
