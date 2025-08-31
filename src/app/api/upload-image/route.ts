import { NextRequest, NextResponse } from "next/server";
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, base64 } = body;

    if (!fileName || !base64) {
      return NextResponse.json(
        { error: "fileName and base64 data are required" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');
    
    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, uniqueFileName);
    
    // Ensure upload directory exists
    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error("File write error:", writeError);
      
      // Fallback: Return base64 data URL for immediate use
      return NextResponse.json({
        url: `data:image/png;base64,${base64}`,
        message: "File uploaded as data URL (temporary)",
        temporary: true
      });
    }
    
    // Return public URL
    const publicUrl = `/uploads/${uniqueFileName}`;
    
    return NextResponse.json({
      url: publicUrl,
      fileName: uniqueFileName,
      originalName: fileName,
      size: buffer.length,
      success: true
    });

  } catch (error: any) {
    console.error("❌ Upload error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to upload image",
        success: false
      },
      { status: 500 }
    );
  }
}

// Alternative implementation using cloud storage (Cloudinary example)
/*
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, base64 } = body;

    if (!fileName || !base64) {
      return NextResponse.json(
        { error: "fileName and base64 data are required" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64}`,
      {
        folder: 'thumbnails',
        public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}`,
        resource_type: 'image',
      }
    );

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      success: true
    });

  } catch (error: any) {
    console.error("❌ Cloudinary upload error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to upload image",
        success: false
      },
      { status: 500 }
    );
  }
}
*/