"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/utils/utils"
import { MultiPhotoUploader } from "@/components/multi-photo-uploader"

export type GenerateRequest = {
  videoType: string
  style: string
  mood: string
  placement: "left" | "center" | "right"
  variants: number
  videoTitle: string
  primaryColor: string
  accentColor: string
}

export function ThumbnailForm({
  onGenerate,
}: {
  onGenerate: (req: GenerateRequest & { userPhotoDataUrls: string[] }) => Promise<void>
}) {
  const [videoType, setVideoType] = useState("")
  const [style, setStyle] = useState("")
  const [mood, setMood] = useState("")
  const [placement, setPlacement] = useState<GenerateRequest["placement"]>("right")
  const [variants, setVariants] = useState(4)
  const [videoTitle, setVideoTitle] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#2563eb")
  const [accentColor, setAccentColor] = useState("#f59e0b")
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) return alert("Please upload at least one photo.")
    setSubmitting(true)
    try {
      const userPhotoDataUrls = await Promise.all(files.map(fileToDataUrl))
      await onGenerate({
        videoType,
        style,
        mood,
        placement,
        variants,
        videoTitle,
        primaryColor,
        accentColor,
        userPhotoDataUrls,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Photos</Label>
          <MultiPhotoUploader files={files} onChange={setFiles} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-title">Video Title</Label>
          <Input
            id="video-title"
            placeholder="e.g., I Tried 5 AI Thumbnail Tricks!"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-type">Video Type</Label>
          <Input
            id="video-type"
            placeholder="e.g., Tech tutorial, Product review"
            value={videoType}
            onChange={(e) => setVideoType(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="style">Style</Label>
          <Input
            id="style"
            placeholder="e.g., Bold, Minimal, Pop, Cinematic"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mood">Mood / Angle</Label>
          <Textarea
            id="mood"
            placeholder="e.g., Excited, Urgent, Calm — include any keywords you'd like on the thumbnail"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Place my photo on</Label>
          <RadioGroup
            className="grid grid-cols-3 gap-2"
            value={placement}
            onValueChange={(v) => setPlacement(v as GenerateRequest["placement"])}
          >
            {(["left", "center", "right"] as const).map((p) => (
              <label
                key={p}
                className={cn(
                  "border rounded-md p-2 text-center cursor-pointer",
                  placement === p ? "border-blue-600 ring-2 ring-blue-200" : "border-input",
                )}
              >
                <RadioGroupItem className="sr-only" value={p} id={`placement-${p}`} />
                <span className="capitalize">{p}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Brand Colors</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="primary-color" className="text-xs">
                Primary
              </Label>
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="accent-color" className="text-xs">
                Accent
              </Label>
              <Input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Used to guide styles and text overlays in prompts.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="variants">How many styles?</Label>
          <Input
            id="variants"
            type="number"
            min={1}
            max={8}
            value={variants}
            onChange={(e) => setVariants(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">We’ll generate both 16:9 and 9:16 for each style.</p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
            {submitting ? "Generating…" : "Generate thumbnails"}
          </Button>
        </div>
      </div>
    </form>
  )
}
