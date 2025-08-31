// // It posts all fields to /api/generate, which can ignore extra fields if not used yet.
// "use client"

// import { useState, useMemo } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Separator } from "@/components/ui/separator"
// import { MultiPhotoUploader } from "@/components/multi-photo-uploader"
// import { cn } from "@/utils/utils"

// type Placement = "left" | "right" | "center"
// type GenerateResponse = {
//   // Keep flexible to align with your existing API
//   // Ideally: { files: Array<{ url: string, mediaType: string }> }
//   files?: Array<{ url?: string; mediaType?: string; name?: string }>
//   images?: string[] // fallback for older responses
//   error?: string
// }

// export default function BuilderPage() {
//   const [videoTitle, setVideoTitle] = useState("")
//   const [primaryColor, setPrimaryColor] = useState("#2563eb") // blue-600
//   const [accentColor, setAccentColor] = useState("#f59e0b") // amber-500
//   const [placement, setPlacement] = useState<Placement>("right")
//   const [style, setStyle] = useState("Bold, high-contrast, clickable")
//   const [mood, setMood] = useState("Excited")
//   const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
//   const [isGenerating, setIsGenerating] = useState(false)
//   const [result, setResult] = useState<GenerateResponse | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const canGenerate = useMemo(() => uploadedFiles.length > 0 && !isGenerating, [uploadedFiles, isGenerating])

//   async function onGenerate() {
//     setIsGenerating(true)
//     setError(null)
//     try {
//       const payload = {
//         videoTitle,
//         colors: { primary: primaryColor, accent: accentColor },
//         placement,
//         style,
//         mood,
//         // We typically don't send images to background generation if using Gemini to make backgrounds;
//         // If your flow uploads to Blob first, do that here and send blob URLs instead.
//         subjectCount: uploadedFiles.length,
//       }
//       const res = await fetch("/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       })
//       if (!res.ok) {
//         const txt = await res.text()
//         throw new Error(txt || "Generation failed")
//       }
//       const data: GenerateResponse = await res.json()
//       setResult(data)
//     } catch (e: unknown) {
//       setError(e instanceof Error ? e.message : "Something went wrong")
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   return (
//     <main className="container mx-auto max-w-5xl px-4 py-8">
//       <header className="mb-8">
//         <h1 className="text-2xl font-semibold text-balance">AI Thumbnail Builder</h1>
//         <p className="text-sm text-muted-foreground">
//           Upload multiple photos, set title and colors, choose placement, and generate backgrounds. Your existing flow
//           can composite subjects and overlay the title using these options.
//         </p>
//       </header>

//       <div className="grid gap-6 md:grid-cols-5">
//         <section className="md:col-span-3 space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Video details</CardTitle>
//               <CardDescription>Give context so the AI can design better backgrounds.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="videoTitle">Video title</Label>
//                 <Input
//                   id="videoTitle"
//                   placeholder="e.g. 10 Thumbnail Secrets to Explode Your Views"
//                   value={videoTitle}
//                   onChange={(e) => setVideoTitle(e.target.value)}
//                 />
//               </div>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label htmlFor="style">Style</Label>
//                   <Input
//                     id="style"
//                     placeholder="Bold, minimal, cinematic, etc."
//                     value={style}
//                     onChange={(e) => setStyle(e.target.value)}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="mood">Mood</Label>
//                   <Input
//                     id="mood"
//                     placeholder="Excited, suspenseful, playful..."
//                     value={mood}
//                     onChange={(e) => setMood(e.target.value)}
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Placement</Label>
//                 <Select value={placement} onValueChange={(v) => setPlacement(v as Placement)}>
//                   <SelectTrigger aria-label="Subject placement">
//                     <SelectValue placeholder="Choose placement" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="left">Left</SelectItem>
//                     <SelectItem value="center">Center</SelectItem>
//                     <SelectItem value="right">Right</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label htmlFor="primaryColor">Primary color</Label>
//                   <div className="flex items-center gap-3">
//                     <input
//                       id="primaryColor"
//                       type="color"
//                       className="h-9 w-14 rounded border bg-background"
//                       value={primaryColor}
//                       onChange={(e) => setPrimaryColor(e.target.value)}
//                       aria-label="Pick primary color"
//                     />
//                     <Input
//                       value={primaryColor}
//                       onChange={(e) => setPrimaryColor(e.target.value)}
//                       className="font-mono"
//                     />
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="accentColor">Accent color</Label>
//                   <div className="flex items-center gap-3">
//                     <input
//                       id="accentColor"
//                       type="color"
//                       className="h-9 w-14 rounded border bg-background"
//                       value={accentColor}
//                       onChange={(e) => setAccentColor(e.target.value)}
//                       aria-label="Pick accent color"
//                     />
//                     <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono" />
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Upload photos</CardTitle>
//               <CardDescription>Select multiple subject images and remove any you don’t want.</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <MultiPhotoUploader files={uploadedFiles} onChange={setUploadedFiles} />
//             </CardContent>
//           </Card>
//         </section>

//         <section className="md:col-span-2 space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>Summary</CardTitle>
//               <CardDescription>These options will be sent to your generator.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-3 text-sm">
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground">Title</span>
//                 <span className="font-medium truncate max-w-[12rem]" title={videoTitle || "—"}>
//                   {videoTitle || "—"}
//                 </span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground">Placement</span>
//                 <span className="font-medium capitalize">{placement}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground">Style</span>
//                 <span className="font-medium truncate max-w-[12rem]" title={style}>
//                   {style}
//                 </span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground">Mood</span>
//                 <span className="font-medium">{mood}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground">Primary</span>
//                 <span className="flex items-center gap-2 font-medium">
//                   <span
//                     className="inline-block h-4 w-4 rounded border"
//                     style={{ backgroundColor: primaryColor }}
//                     aria-label="Primary color preview"
//                   />
//                   <code className="text-xs">{primaryColor}</code>
//                 </span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground">Accent</span>
//                 <span className="flex items-center gap-2 font-medium">
//                   <span
//                     className="inline-block h-4 w-4 rounded border"
//                     style={{ backgroundColor: accentColor }}
//                     aria-label="Accent color preview"
//                   />
//                   <code className="text-xs">{accentColor}</code>
//                 </span>
//               </div>

//               <Separator />
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground">Photos</span>
//                 <span className="font-medium">{uploadedFiles.length}</span>
//               </div>
//               <Button className="w-full" onClick={onGenerate} disabled={!canGenerate}>
//                 {isGenerating ? "Generating..." : "Generate backgrounds"}
//               </Button>
//               {error ? <p className="text-sm text-destructive">{error}</p> : null}
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Results</CardTitle>
//               <CardDescription>Raw outputs from your generator.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               {!result && <p className="text-sm text-muted-foreground">Nothing yet. Click generate to start.</p>}
//               {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
//               <div className="grid grid-cols-2 gap-3">
//                 {result?.files?.map((f, i) => (
//                   <a
//                     key={i}
//                     href={f.url}
//                     target="_blank"
//                     rel="noreferrer"
//                     className={cn("block overflow-hidden rounded border bg-muted/30 hover:bg-muted transition")}
//                   >
//                     {/* eslint-disable-next-line @next/next/no-img-element */}
//                     <img src={f.url || "/placeholder.svg"} alt={`result-${i}`} className="w-full h-28 object-cover" />
//                   </a>
//                 ))}
//                 {!result?.files?.length &&
//                   result?.images?.map((src, i) => (
//                     // eslint-disable-next-line @next/next/no-img-element
//                     <img
//                       key={i}
//                       src={src || "/placeholder.svg"}
//                       alt={`result-${i}`}
//                       className="w-full h-28 object-cover rounded border"
//                     />
//                   ))}
//               </div>
//             </CardContent>
//           </Card>
//         </section>
//       </div>
//     </main>  
//   )
// }
