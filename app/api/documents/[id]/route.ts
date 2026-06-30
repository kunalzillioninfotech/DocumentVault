import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;

    const doc = await DocumentModel.findOne({ _id: id, userId: user.userId });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    if (doc.publicId) {
      const resourceType = doc.fileType === "image" ? "image" : "raw";
      await cloudinary.uploader.destroy(doc.publicId, { resource_type: resourceType });
    }

    await DocumentModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
