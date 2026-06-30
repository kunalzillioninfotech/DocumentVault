"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { IDocument, ViewMode } from "../types/document";
import SearchBar from "./SearchBar";
import DocumentModal from "./DocumentModal";

function FileTypeBadge({ type }: { type: IDocument["fileType"] }) {
  const styles = {
    image: "bg-blue-100 text-blue-700",
    pdf: "bg-red-100 text-red-700",
    csv: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${styles[type]}`}>
      {type}
    </span>
  );
}

function FileThumbnail({ doc, size = "lg" }: { doc: IDocument; size?: "sm" | "lg" }) {
  if (doc.fileType === "image" && doc.fileUrl) {
    return <Image src={doc.fileUrl} alt={doc.name} fill className="object-cover" />;
  }

  const icons = {
    pdf: { bg: "bg-red-50", color: "text-red-400", label: "PDF" },
    csv: { bg: "bg-green-50", color: "text-green-400", label: "CSV" },
    image: { bg: "bg-gray-50", color: "text-gray-300", label: "" },
  };
  const { bg, color, label } = icons[doc.fileType];
  const iconSize = size === "sm" ? "w-7 h-7" : "w-14 h-14";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex flex-col items-center justify-center h-full ${bg}`}>
      <svg className={`${iconSize} ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label && <span className={`font-bold mt-0.5 ${textSize} ${color}`}>{label}</span>}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white">
      <button
        onClick={() => onChange("grid")}
        title="Grid view"
        className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        onClick={() => onChange("list")}
        title="List view"
        className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}

interface CardActionsProps {
  doc: IDocument;
  deletingId: string | null;
  onView: () => void;
  onDelete: () => void;
}

function CardActions({ doc, deletingId, onView, onDelete }: CardActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onView}
        disabled={!doc.fileUrl}
        className="flex-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg py-2 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {doc.fileType === "image" ? "View" : doc.fileType === "csv" ? "Download" : "Open"}
      </button>
      <button
        onClick={onDelete}
        disabled={deletingId === doc._id}
        className="flex-1 text-sm font-medium text-red-500 border border-red-400 rounded-lg py-2 hover:bg-red-50 transition-colors disabled:opacity-40"
      >
        {deletingId === doc._id ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}

export default function Documents() {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedDoc, setSelectedDoc] = useState<IDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (doc: IDocument) => {
    setDeletingId(doc._id);
    try {
      await fetch(`/api/documents/${doc._id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (doc: IDocument) => {
    if (doc.fileType === "image") {
      setSelectedDoc(doc);
    } else if (doc.fileType === "csv") {
      const a = document.createElement("a");
      a.href = `/api/documents/${doc._id}/download`;
      a.click();
    } else {
      window.open(`/api/documents/${doc._id}/download?disposition=inline`, "_blank", "noopener,noreferrer");
    }
  };

  const filtered = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Documents</h1>
          <p className="text-gray-500 text-sm mt-1">
            {documents.length} document{documents.length !== 1 ? "s" : ""} stored
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-500 mb-2">No documents yet</h2>
          <p className="text-gray-400 text-sm mb-6">Start by adding your first document.</p>
          <Link href="/add-document" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            + Add Document
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-500 mb-1">No results found</h2>
          <p className="text-gray-400 text-sm">Try a different search term.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <div key={doc._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="relative w-full h-44 bg-gray-100 flex-shrink-0">
                <FileThumbnail doc={doc} />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">{doc.name}</h3>
                  <FileTypeBadge type={doc.fileType} />
                </div>
                <p className="text-gray-500 text-sm line-clamp-2 flex-1">{doc.description}</p>
                <p className="text-xs text-gray-400 mt-3 mb-4">
                  {new Date(doc.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
                <CardActions doc={doc} deletingId={deletingId} onView={() => handleView(doc)} onDelete={() => handleDelete(doc)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="hidden sm:grid grid-cols-[2fr_3fr_1fr_auto] gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>Name</span>
            <span>Description</span>
            <span>Date</span>
            <span className="w-40">Actions</span>
          </div>

          {filtered.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow px-4 py-3 flex flex-col sm:grid sm:grid-cols-[2fr_3fr_1fr_auto] sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <FileThumbnail doc={doc} size="sm" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{doc.name}</p>
                  <div className="mt-0.5">
                    <FileTypeBadge type={doc.fileType} />
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-sm line-clamp-1 hidden sm:block">{doc.description}</p>

              <p className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">
                {new Date(doc.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>

              <div className="flex gap-2 w-full sm:w-40">
                <button
                  onClick={() => handleView(doc)}
                  disabled={!doc.fileUrl}
                  className="flex-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg py-1.5 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {doc.fileType === "image" ? "View" : doc.fileType === "csv" ? "Download" : "Open"}
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc._id}
                  className="flex-1 text-sm font-medium text-red-500 border border-red-400 rounded-lg py-1.5 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  {deletingId === doc._id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoc && (
        <DocumentModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}