import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  sendDataToQueue,
  getProcessedQueueMessage,
} from "@/core/functions/queue";

function QueuePoller({
  queueId,
  onReset,
}: {
  queueId: string;
  onReset: () => void;
}) {
  const getProcessedMessageFn = useServerFn(getProcessedQueueMessage);

  const { data: processedMessage, isLoading } = useQuery({
    queryKey: ["processedMessage", queueId],
    queryFn: async () => {
      const result = await getProcessedMessageFn({ data: queueId });
      return result;
    },
    refetchInterval: (query) => (query.state.data === null ? 1000 : false),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {processedMessage === null ? "Processing..." : "Processed Message"}
        </CardTitle>
        <CardDescription>
          {processedMessage === null
            ? "Waiting for queue response"
            : "Result from queue"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {processedMessage === null ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                Polling for processed message...
              </p>
              <p className="text-xs text-muted-foreground">
                Queue ID: {queueId}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-green-500/50 bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Processed:
                  </p>
                  <p className="text-sm text-foreground">{processedMessage}</p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={onReset}
              variant="outline"
              className="w-full"
            >
              Send Another Message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QueueDemo() {
  const [message, setMessage] = useState("");
  const [queueId, setQueueId] = useState<string | null>(null);

  const sendToQueueFn = useServerFn(sendDataToQueue);

  const { mutate, isPending } = useMutation({
    mutationFn: (msg: string) => {
      const id = crypto.randomUUID();
      return sendToQueueFn({ data: { message: msg, id } });
    },
    onSuccess: (id) => {
      setQueueId(id);
      setMessage("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      mutate(message.trim());
    }
  };

  const handleReset = () => {
    setQueueId(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Queue Message Demo</CardTitle>
            <CardDescription>
              Submit a message to the queue and watch it get processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isPending || !!queueId}
              />
              <Button
                type="submit"
                disabled={isPending || !message.trim() || !!queueId}
                className="w-full"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Submitting..." : "Send to Queue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {queueId && <QueuePoller queueId={queueId} onReset={handleReset} />}
      </div>
    </div>
  );
}
