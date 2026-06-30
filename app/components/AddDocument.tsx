"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { FileType } from "../types/document";

interface FormState {
  name: string;
  description: string;
}

const initialForm: FormState = { name: "", description: "" };

const ACCEPTED_MIME = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip", "application/x-zip-compressed", "application/octet-stream",
];
const ACCEPTED_TYPES = "image/*,.pdf,.csv,text/csv,.doc,.docx,.zip";

function detectFileType(file: File): FileType {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) return "csv";
  const name = file.name.toLowerCase();
  if (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".doc") || name.endsWith(".docx")
  ) return "doc";
  if (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    name.endsWith(".zip")
  ) return "zip";
  return "image";
}

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    ACCEPTED_MIME.includes(file.type) ||
    file.type.startsWith("image/") ||
    name.endsWith(".csv") ||
    name.endsWith(".doc") || name.endsWith(".docx") ||
    name.endsWith(".zip")
  );
}

function FilePreview({ file, previewUrl }: { file: File; previewUrl: string }) {
  const fileType = detectFileType(file);

  if (fileType === "image") {
    return (
      <div className="relative w-full h-40 rounded-lg overflow-hidden">
        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
      </div>
    );
  }

  const config = {
    pdf: { bg: "bg-red-50", icon: "text-red-400", label: "PDF File", color: "text-red-600" },
    csv: { bg: "bg-green-50", icon: "text-green-400", label: "CSV File", color: "text-green-600" },
    doc: { bg: "bg-blue-50", icon: "text-blue-400", label: "Word Document", color: "text-blue-600" },
    zip: { bg: "bg-yellow-50", icon: "text-yellow-500", label: "ZIP Archive", color: "text-yellow-600" },
    image: { bg: "bg-gray-50", icon: "text-gray-300", label: "", color: "" },
  };
  const { bg, icon, label, color } = config[fileType];

  return (
    <div className={`flex flex-col items-center justify-center py-6 rounded-lg w-full ${bg}`}>
      <svg className={`w-12 h-12 ${icon} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className={`text-sm font-semibold ${color}`}>{label}</p>
      <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{file.name}</p>
    </div>
  );
}

export default function AddDocument() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<FormState & { file: string }>>({});
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const router = useRouter();

  const applyFile = (selected: File) => {
    if (!isAccepted(selected)) {
      setErrors((prev) => ({ ...prev, file: "Unsupported file type. Use Image, PDF, CSV, DOC/DOCX, or ZIP." }));
      return;
    }
    setFile(selected);
    setErrors((prev) => ({ ...prev, file: "" }));
    if (detectFileType(selected) === "image") {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreviewUrl("");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) applyFile(selected);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState & { file: string }> = {};
    if (!form.name.trim()) newErrors.name = "Document name is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    if (!file) newErrors.file = "Please upload a file (Image, PDF, CSV, DOC/DOCX, or ZIP).";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      if (file) formData.append("file", file);

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      toast.success("Document added successfully!");
      router.push("/");
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, file: "Failed to upload. Please try again." }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    clearFile();
  };

  const dropzoneClass = (() => {
    if (isDragging) return "border-blue-500 bg-blue-50";
    if (errors.file) return "border-red-400";
    return "border-gray-300 hover:border-blue-400";
  })();

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Document</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below to add a document.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Project Proposal"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description of the document..."
            rows={4}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File <span className="text-red-500">*</span>{" "}
            <span className="text-gray-400 font-normal">(Image, PDF, CSV, DOC, or ZIP)</span>
          </label>

          <div
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${dropzoneClass}`}
            onClick={() => fileRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isDragging ? (
              <div className="flex flex-col items-center py-6 pointer-events-none">
                <svg className="w-12 h-12 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-semibold text-blue-600">Drop your file here</p>
              </div>
            ) : file ? (
              <FilePreview file={file} previewUrl={previewUrl} />
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-500">
                  Drag & drop or{" "}
                  <span className="text-blue-600 font-medium">click to upload</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, PDF, CSV, DOC, DOCX, ZIP</p>
              </>
            )}
          </div>

          <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} className="hidden" />

          {file && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="text-xs text-red-500 mt-2 hover:underline"
            >
              Remove file
            </button>
          )}
          {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              "Add Document"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}