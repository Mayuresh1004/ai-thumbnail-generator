"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function UploadForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { register, handleSubmit } = useForm();

  return (
    <Card className="p-4 bg-black text-white border border-gray-800">
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Video Title</label>
          <Input {...register("title")} placeholder="e.g., I Tried 5 AI Thumbnail Tricks!" />
        </div>

        <div>
          <label className="block text-sm mb-1">Video Type</label>
          <Input {...register("type")} placeholder="e.g., Tech tutorial, Product review" />
        </div>

        <div>
          <label className="block text-sm mb-1">Style</label>
          <Input {...register("style")} placeholder="e.g., Bold, Minimal, Cinematic" />
        </div>

        <div>
          <label className="block text-sm mb-1">Mood / Angle</label>
          <Input {...register("mood")} placeholder="e.g., Excited, Urgent, Calm" />
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleSubmit(onSubmit)}>
          Generate Thumbnails
        </Button>
      </CardContent>
    </Card>
  );
}
