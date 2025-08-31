import { useState } from "react";

export function useThumbnail() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateThumbnail(data: any) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-thumbnail", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setImages(result.images || []);
    } catch (err) {
      setError("Something went wrong while generating thumbnails!");
    } finally {
      setLoading(false);
    }
  }

  return { images, loading, error, generateThumbnail };
}
