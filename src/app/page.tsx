"use client"
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Download, Copy, Share2 } from "lucide-react";

export default function ThumbnailGenerator() {
  const [photoPlacement, setPhotoPlacement] = useState("right");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  const [videoTitle, setVideoTitle] = useState("");
  const [videoType, setVideoType] = useState("");
  const [style, setStyle] = useState("");
  const [mood, setMood] = useState("");
  const [numStyles, setNumStyles] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Array<{url: string, aspectRatio: string, styleIndex: number}>>([]);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

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
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const rewritePrompt = async (formData: any) => {
    try {
      const res = await fetch("/api/rewrite-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          style: formData.style,
          mood: formData.mood,
          placement: formData.placement,
          colors: formData.colors
        }),
      });
      
      const data = await res.json();
      
      // Handle both success and fallback cases
      if (data.rewrittenPrompt) {
        return data.rewrittenPrompt;
      }
      
      throw new Error(data.error || "Failed to rewrite prompt");
      
    } catch (error) {
      console.error("Error rewriting prompt:", error);
             // Fallback prompt generation
       return `Create a ${formData.style || 'bold and dynamic'} YouTube thumbnail background with ${formData.mood || 'exciting'} energy. The background should have dramatic lighting, gradients, and visual effects that support "${formData.title}" content. Leave the ${formData.placement} side open for subject placement. Include space for bold text overlays. Make it eye-catching and professional for ${formData.type || 'video'} content.`;
    }
  };

  const generateThumbnail = async (prompt: string, files: File[], aspectRatio: string) => {
    // Convert files to base64
    const base64Images = await Promise.all(
      files.map(async (file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:image/png;base64, prefix
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    const res = await fetch("/api/generate-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt, 
        images: base64Images,
        model: "google/gemini-2.5-flash-image-preview:free",
        aspectRatio: aspectRatio
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Failed to generate thumbnail`);
    }
    
    if (!data.url) {
      throw new Error("No image URL returned from API");
    }
    
    return data;
  };
  
  const handleGenerate = async () => {
    if (photos.length === 0) {
      setError("Please upload at least one photo!");
      return;
    }

    if (!videoTitle.trim()) {
      setError("Please enter a video title!");
      return;
    }

    setIsGenerating(true);
    setError("");
    setGeneratedThumbnails([]);
    setDebugInfo([]);
  
    try {
             const formData = {
         title: videoTitle,
         type: videoType || "video content",
         style: style || "bold and dynamic",
         mood: mood || "exciting and engaging",
         placement: photoPlacement,
       };
  
      console.log("Rewriting prompt with:", formData);
      setDebugInfo(prev => [...prev, "🔄 Rewriting prompt..."]);
      const rewrittenPrompt = await rewritePrompt(formData);
      console.log("Rewritten prompt:", rewrittenPrompt);
      setDebugInfo(prev => [...prev, "✅ Prompt rewritten successfully"]);
      
             // Generate multiple thumbnails with both aspect ratios
       setDebugInfo(prev => [...prev, `🎨 Generating ${numStyles} styles in both 16:9 and 9:16...`]);
       
       const allThumbnails: Array<{url: string, aspectRatio: string, styleIndex: number}> = [];
       
       for (let i = 0; i < numStyles; i++) {
         const variantPrompt = `${rewrittenPrompt}\n\nStyle variation ${i + 1}: ${getStyleVariation(i)}`;
         console.log(`Generating style ${i + 1} with prompt:`, variantPrompt);
         
         // Generate 16:9 version
         try {
           setDebugInfo(prev => [...prev, `⏳ Generating style ${i + 1} (16:9)...`]);
           const result16x9 = await generateThumbnail(variantPrompt, photos.map((p) => p.file), "16:9");
           allThumbnails.push({
             url: result16x9.url,
             aspectRatio: "16:9",
             styleIndex: i + 1
           });
           setDebugInfo(prev => [...prev, `✅ Style ${i + 1} (16:9) generated successfully`]);
         } catch (error) {
           console.error(`Failed to generate style ${i + 1} (16:9):`, error);
           setDebugInfo(prev => [...prev, `❌ Style ${i + 1} (16:9) failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
         }
         
         // Generate 9:16 version
         try {
           setDebugInfo(prev => [...prev, `⏳ Generating style ${i + 1} (9:16)...`]);
           const result9x16 = await generateThumbnail(variantPrompt, photos.map((p) => p.file), "9:16");
           allThumbnails.push({
             url: result9x16.url,
             aspectRatio: "9:16",
             styleIndex: i + 1
           });
           setDebugInfo(prev => [...prev, `✅ Style ${i + 1} (9:16) generated successfully`]);
         } catch (error) {
           console.error(`Failed to generate style ${i + 1} (9:16):`, error);
           setDebugInfo(prev => [...prev, `❌ Style ${i + 1} (9:16) failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
         }
       }
       
       if (allThumbnails.length === 0) {
         throw new Error("Failed to generate any thumbnails. Please check your API keys and try again.");
       }
       
       console.log(`Successfully generated ${allThumbnails.length} thumbnails (${numStyles} styles × 2 aspect ratios)`);
       setGeneratedThumbnails(allThumbnails);
       
       if (allThumbnails.length < numStyles * 2) {
         setError(`Generated ${allThumbnails.length} out of ${numStyles * 2} requested thumbnails. Some generations failed.`);
       }
      
    } catch (error) {
      console.error("Generation error:", error);
      setError(error instanceof Error ? error.message : "Failed to generate thumbnails. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to create style variations
  const getStyleVariation = (index: number) => {
    const variations = [
      "with vibrant gradients and bold typography",
      "with dramatic shadows and neon accents", 
      "with minimalist design and clean lines",
      "with explosive effects and dynamic composition",
      "with cinematic lighting and professional polish",
      "with retro aesthetics and vintage vibes",
      "with futuristic elements and tech styling",
      "with organic shapes and natural textures"
    ];
    return variations[index % variations.length];
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `thumbnail-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      if (navigator.clipboard && 'ClipboardItem' in window) {
        const response = await fetch(url);
        const blob = await response.blob();
        const clipboardItem = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([clipboardItem]);
        alert("Image copied to clipboard!");
      } else {
        await navigator.clipboard.writeText(url);
        alert("Image URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy image");
    }
  };

  const handleDownloadZip = async () => {
    try {
      if (generatedThumbnails.length === 0) {
        alert("No thumbnails to download!");
        return;
      }

      // Create a zip file using JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Download all thumbnails and add to zip
      for (let i = 0; i < generatedThumbnails.length; i++) {
        const thumbnail = generatedThumbnails[i];
        try {
          const response = await fetch(thumbnail.url);
          const blob = await response.blob();
          const fileName = `thumbnail-style${thumbnail.styleIndex}-${thumbnail.aspectRatio}.png`;
          zip.file(fileName, blob);
        } catch (error) {
          console.error(`Failed to add thumbnail ${i + 1} to zip:`, error);
        }
      }

      // Generate and download zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `thumbnails-${videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      alert(`Downloaded ${generatedThumbnails.length} thumbnails as ZIP file!`);
    } catch (error) {
      console.error("Zip download failed:", error);
      alert("Failed to create ZIP file. Please try downloading individual thumbnails.");
    }
  };

  const handleShare = async (url: string, index: number) => {
    try {
      // First try Web Share API
      if (navigator.share) {
        await navigator.share({
          title: `AI Generated Thumbnail ${index + 1}`,
          text: `Check out this AI-generated thumbnail for "${videoTitle}"`,
          url: url
        });
        return;
      }
      
      // Fallback: Upload to server and get shareable link
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      });
      
      // Upload to server
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `thumbnail-${index + 1}-${Date.now()}.png`,
          base64: base64
        })
      });
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        const shareableUrl = uploadData.url.startsWith('http') 
          ? uploadData.url 
          : `${window.location.origin}${uploadData.url}`;
        
        // Copy shareable URL to clipboard
        await navigator.clipboard.writeText(shareableUrl);
        alert(`Shareable link copied to clipboard: ${shareableUrl}`);
      } else {
        throw new Error('Failed to create shareable link');
      }
      
    } catch (error) {
      console.error("Share failed:", error);
      // Final fallback: just copy the original URL
      await handleCopy(url);
      alert("Shared by copying image URL to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-2 text-blue-400">AI Thumbnail Generator</h1>
      <p className="text-neutral-400 mb-6">
        Upload your photo, describe your video, choose placement, and get multiple thumbnail options. Each style generates 16:9 (landscape) version.
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
                className="flex items-center justify-center border-2 border-dashed border-neutral-600 rounded-xl p-6 cursor-pointer hover:border-neutral-400 text-neutral-300 transition-colors"
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
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <TabsTrigger value="left" className="data-[state=active]:bg-neutral-700">Left</TabsTrigger>
                  <TabsTrigger value="center" className="data-[state=active]:bg-neutral-700">Center</TabsTrigger>
                  <TabsTrigger value="right" className="data-[state=active]:bg-neutral-700">Right</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Brand colors */}


            {/* Video Title */}
            <div>
              <label className="block mb-1 text-blue-300">Video Title *</label>
              <Input 
                placeholder="e.g., I Tried 5 AI Thumbnail Tricks!" 
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
              />
            </div>

            {/* Video Type */}
            <div>
              <label className="block mb-1 text-blue-300">Video Type</label>
              <Input 
                placeholder="e.g., Tech tutorial, Product review" 
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
              />
            </div>

            {/* Style */}
            <div>
              <label className="block mb-1 text-blue-300">Style</label>
              <Input 
                placeholder="e.g., Bold, Minimal, Pop, Cinematic" 
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
            </div>

            {/* Mood / Angle */}
            <div>
              <label className="block mb-1 text-blue-300">Mood / Angle(u can also describe the thumbnail you want)</label>
              <Textarea 
                placeholder="e.g., Excited, Urgent, Calm — include keywords you'd like" 
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 min-h-20"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
            </div>

            {/* Number of styles */}
            <div>
              <label className="block mb-1 text-blue-300">How many styles?</label>
              <Input 
                type="number" 
                min="1"
                max="8"
                value={numStyles}
                onChange={(e) => setNumStyles(parseInt(e.target.value) || 4)}
                className="bg-neutral-800 border-neutral-600 text-white" 
              />
              <p className="text-xs text-neutral-400 mt-1">
                We'll generate  16:9 Thumbnail.
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className={`p-3 border rounded-lg text-sm ${
                error.includes('Generated') && error.includes('out of') 
                  ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' 
                  : 'bg-red-900/50 border-red-700 text-red-300'
              }`}>
                {error}
              </div>
            )}

            {/* Generate button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGenerate}
              disabled={isGenerating || photos.length === 0}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating thumbnails...
                </div>
              ) : (
                "Generate thumbnails"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-6">
            {isGenerating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-neutral-400">Generating your thumbnails...</p>
                </div>
              </div>
            ) : generatedThumbnails.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-300">Generated Thumbnails</h3>
                  <span className="text-sm text-neutral-400">
                    {generatedThumbnails.length} thumbnail{generatedThumbnails.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Debug info */}
                {debugInfo.length > 0 && (
                  <details className="text-xs text-neutral-500">
                    <summary className="cursor-pointer hover:text-neutral-400">Show generation log</summary>
                    <div className="mt-2 space-y-1 pl-4 border-l border-neutral-700">
                      {debugInfo.map((info, i) => (
                        <div key={i}>{info}</div>
                      ))}
                    </div>
                  </details>
                )}
                {/* Download All Button */}
                {generatedThumbnails.length > 0 && (
                  <div className="mb-4">
                    <Button
                      onClick={handleDownloadZip}
                      className="w-full bg-green-600 hover:bg-green-500"
                    >
                      <Download size={16} className="mr-2" />
                      Download All as ZIP ({generatedThumbnails.length} thumbnails)
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {generatedThumbnails.map((thumbnail, index) => (
                    <div key={index} className="space-y-3">
                      <div className="relative group">
                        <img
                          src={thumbnail.url}
                          alt={`Generated thumbnail ${index + 1}`}
                          className="w-full rounded-lg border border-neutral-700"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          Style {thumbnail.styleIndex} - {thumbnail.aspectRatio}
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(thumbnail.url, index)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopy(thumbnail.url)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleShare(thumbnail.url, index)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                          >
                            <Share2 size={16} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(thumbnail.url, index)}
                          className="flex-1 bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(thumbnail.url)}
                          className="flex-1 bg-neutral-800 border-neutral-600 hover:bg-neutral-700"
                        >
                          <Copy size={14} className="mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-neutral-400">
                  <div className="w-16 h-16 border-2 border-dashed border-neutral-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-neutral-700 rounded"></div>
                  </div>
                  <p>No thumbnails yet. Generate to see previews here.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}