"use client";

import ErrorMessage from "./ErrorMessage";
import Loader from "./Loader";

export default function ThumbnailPreview({ images, loading, error }: { images: string[], loading: boolean, error: string }) {
  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((src, i) => (
        <div key={i} className="rounded-lg overflow-hidden border border-neutral-700">
          <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-auto" />
        </div>
      ))}
    </div>
  );
}
