import mongoose, { Schema, model, models } from "mongoose";

export type FileType = "image" | "pdf" | "csv" | "doc" | "zip";

const DocumentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    fileUrl: { type: String, default: "" },
    fileType: { type: String, enum: ["image", "pdf", "csv", "doc", "zip"], default: "image" },
    publicId: { type: String, default: "" },
  },
  { timestamps: true }
);

// Clear cached model in development so HMR schema changes take effect immediately
if (process.env.NODE_ENV !== "production") {
  delete (models as Record<string, unknown>)["Document"];
}

export default models.Document || model("Document", DocumentSchema);