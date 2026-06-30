import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";
import { FileType } from "@/app/types/document";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const uid = new Types.ObjectId(user.userId);
    const docs = await DocumentModel.find({ userId: uid }).sort({ createdAt: -1 }).lean();
    const serialized = docs.map((doc) => ({
      ...doc,
      _id: (doc._id as { toString(): string }).toString(),
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const formData = await req.formData();
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const file = formData.get("file") as File | null;

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    let fileUrl = "";
    let publicId = "";
    let fileType: FileType = "image";

    if (file && file.size > 0) {
      const mimeType = file.type;
      if (mimeType === "application/pdf") fileType = "pdf";
      else if (mimeType === "text/csv" || file.name.toLowerCase().endsWith(".csv")) fileType = "csv";
      else fileType = "image";

      const buffer = Buffer.from(await file.arrayBuffer());
      const resourceType = fileType === "image" ? "image" : "raw";
      const formatMap: Record<string, string> = { pdf: "pdf", csv: "csv" };

      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "document-management",
                resource_type: resourceType,
                public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-")}`,
                ...(formatMap[fileType] ? { format: formatMap[fileType] } : {}),
              },
              (error, result) => {
                if (error || !result) reject(error ?? new Error("Upload failed"));
                else resolve(result as { secure_url: string; public_id: string });
              }
            )
            .end(buffer);
        }
      );

      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    const doc = await DocumentModel.create({ userId: user.userId, name, description, fileUrl, fileType, publicId });
    return NextResponse.json({ ...doc.toObject(), _id: doc._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}