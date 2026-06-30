import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import cloudinary from "@/lib/cloudinary";

const CONTENT_TYPES: Record<string, string> = {
  csv: "text/csv",
  pdf: "application/pdf",
  image: "application/octet-stream",
};

const EXTENSIONS: Record<string, string> = {
  csv: ".csv",
  pdf: ".pdf",
  image: "",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const inline = req.nextUrl.searchParams.get("disposition") === "inline";

    const doc = await DocumentModel.findById(id).lean();
    if (!doc?.publicId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const resourceType = doc.fileType === "image" ? "image" : "raw";

    // Generate a signed URL so Cloudinary accepts the server-side fetch
    // even when the account has delivery restrictions on raw files.
    const signedUrl = cloudinary.url(doc.publicId, {
      resource_type: resourceType,
      sign_url: true,
      secure: true,
      type: "upload",
    });

    const upstream = await fetch(signedUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = CONTENT_TYPES[doc.fileType] ?? "application/octet-stream";
    const ext = EXTENSIONS[doc.fileType] ?? "";
    const filename = `${doc.name}${ext}`.replace(/"/g, "'");
    const disposition = inline ? "inline" : "attachment";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("GET /api/documents/[id]/download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
