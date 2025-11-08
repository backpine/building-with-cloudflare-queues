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
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { getProcessedQueueMessage } from "@/core/functions/queue";

function ImagePoller({
  imageKey,
  onReset,
}: {
  imageKey: string;
  onReset: () => void;
}) {
  const getProcessedMessageFn = useServerFn(getProcessedQueueMessage);

  const { data: processedMessage } = useQuery({
    queryKey: ["processedImage", imageKey],
    queryFn: async () => {
      const result = await getProcessedMessageFn({ data: imageKey });
      return result;
    },
    refetchInterval: (query) => (query.state.data === null ? 1000 : false),
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {processedMessage === null && (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
          {processedMessage === null
            ? "Processing Image..."
            : "Processing Complete"}
        </CardTitle>
        <CardDescription>
          {processedMessage === null
            ? "Waiting for image processing"
            : "Image processing result"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {processedMessage === null ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Processing image...</p>
              <p className="text-xs text-muted-foreground">Key: {imageKey}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-green-500/50 bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Processing Result:
                  </p>
                  <p className="text-sm text-foreground">{processedMessage}</p>
                </div>
              </div>
            </div>
            <Button onClick={onReset} variant="outline" className="w-full">
              Upload Another Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File): Promise<{ key: string; url: string }> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: (data: { key: string; url: string }) => {
      setImageKey(data.key);
      setPreview(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImageKey(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      mutate(file);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImageKey(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Upload an image to Cloudflare R2 storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isPending || !!imageKey}
              />
              {preview && !imageKey && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 rounded-lg mx-auto"
                  />
                </div>
              )}
              <Button
                onClick={handleUpload}
                disabled={!file || isPending || !!imageKey}
                className="w-full"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to R2
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(preview || imageKey) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {imageKey ? "Uploaded Image" : "Image Preview"}
              </CardTitle>
              <CardDescription>
                {imageKey ? "Image stored in R2" : "Preview before upload"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/30">
                <img
                  src={preview || `/api/images/${imageKey}`}
                  alt={imageKey ? "Uploaded" : "Preview"}
                  className="w-full rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {imageKey && <ImagePoller imageKey={imageKey} onReset={handleReset} />}
      </div>
    </div>
  );
}
