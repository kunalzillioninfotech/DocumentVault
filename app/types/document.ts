export type FileType = "image" | "pdf" | "csv";

export type ViewMode = "grid" | "list";

export interface IDocument {
  _id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileType: FileType;
  publicId: string;
  createdAt: string;
  updatedAt: string;
}