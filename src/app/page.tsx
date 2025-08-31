"use client"
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

export default function ThumbnailGenerator() {
  const [photoPlacement, setPhotoPlacement] = useState("right");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [accentColor, setAccentColor] = useState("#f59e0b");

  type PhotoItem = {
    file: File;
    preview: string;
  };
  
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };
  
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview); // cleanup memory
      updated.splice(index, 1);
      return updated;
    });
  };
  
  const handleGenerate = async () => {
    if (photos.length === 0) {
      alert("Please upload at least one photo!");
      return;
    }
  
    const formData = {
      title: "Video Title", // TODO: get from input
      type: "Video Type", // TODO: get from input
      style: "Style", // TODO: get from input
      mood: "Mood", // TODO: get from input
      placement: photoPlacement,
      colors: { primary: primaryColor, accent: accentColor },
    };
  
    const rewrittenPrompt = await rewritePrompt(formData);
  
    const result = await generateThumbnail(
      rewrittenPrompt,
      photos.map((p) => p.file) // pass all files
    );
  
    console.log("Generated Thumbnail ✅", result);
  };
  
  
  const rewritePrompt = async (formData: any) => {
    const res = await fetch("/api/rewrite-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    return data.rewrittenPrompt;
  };
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]); // remove data:image/png;base64,
      reader.onerror = reject;
    });
  const generateThumbnail = async (prompt: string, files: File[]) => {
    const base64Images = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return Buffer.from(buffer).toString("base64");
      })
    );

    const res = await fetch("/api/generate-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, images: base64Images }),
    });

    if (!res.ok) throw new Error("Failed to generate thumbnail");
    return res.json();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-2 text-blue-400">AI Thumbnail Generator</h1>
      <p className="text-neutral-400 mb-6">
        Upload your photo, describe your video, choose placement, and get multiple thumbnail options in both 16:9 and 9:16.
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Form */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="space-y-4 p-6">
            {/* Photos */}
            <div>
              <label className="block mb-2 font-medium text-blue-300">Photos</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center border-2 border-dashed border-neutral-600 rounded-xl p-6 cursor-pointer hover:border-neutral-400 text-neutral-300"
              >
                {photos.length > 0
                  ? "Add more photos"
                  : "No photos yet. Click to add."}
              </label>

              {/* Preview thumbnails */}
              {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`upload-${index}`}
                      className="rounded-lg w-full h-24 object-cover border border-neutral-700"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            </div>

            {/* Photo placement */}
            <div>
              <label className="block mb-2 font-medium text-blue-300">Place my photo on</label>
              <Tabs value={photoPlacement} onValueChange={setPhotoPlacement}>
                <TabsList className="grid grid-cols-3 bg-neutral-800">
                  <TabsTrigger value="left">Left</TabsTrigger>
                  <TabsTrigger value="center">Center</TabsTrigger>
                  <TabsTrigger value="right">Right</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Brand colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm text-blue-300">Primary</label>
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-blue-300">Accent</label>
                <Input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
            </div>

            {/* Video Title */}
            <div>
              <label className="block mb-1 text-blue-300">Video Title</label>
              <Input placeholder="e.g., I Tried 5 AI Thumbnail Tricks!" className="text-white placeholder-neutral-500" />
            </div>

            {/* Video Type */}
            <div>
              <label className="block mb-1 text-blue-300">Video Type</label>
              <Input placeholder="e.g., Tech tutorial, Product review" className="text-white placeholder-neutral-500" />
            </div>

            {/* Style */}
            <div>
              <label className="block mb-1 text-blue-300">Style</label>
              <Input placeholder="e.g., Bold, Minimal, Pop, Cinematic" className="text-white placeholder-neutral-500" />
            </div>

            {/* Mood / Angle */}
            <div>
              <label className="block mb-1 text-blue-300">Mood / Angle</label>
              <Textarea placeholder="e.g., Excited, Urgent, Calm — include keywords you'd like" className="text-white placeholder-neutral-500" />
            </div>

            {/* Number of styles */}
            <div>
              <label className="block mb-1 text-blue-300">How many styles?</label>
              <Input type="number" defaultValue={4} className="text-white" />
              <p className="text-xs text-neutral-400 mt-1">
                We'll generate both 16:9 and 9:16 for each style.
              </p>
            </div>

            {/* Generate button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-500"
              onClick={handleGenerate}
            >
              Generate thumbnails
            </Button>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card className="bg-neutral-900 border-neutral-800 flex items-center justify-center">
          <CardContent className="text-neutral-400 text-center p-6">
            No thumbnails yet. Generate to see previews here.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
