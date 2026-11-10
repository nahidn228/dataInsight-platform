"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  ArrowRight,
  ShieldCheck,
  BarChart4,
} from "lucide-react";
import { DatasetApi } from "@/lib/api";
import { useDataset } from "@/context/DatasetContext";

export default function UploadPage() {
  const router = useRouter();
  const { setMetadata, setDatasetId } = useDataset();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setErrorMsg(`Unsupported file type '${fileExt}'. Please upload a CSV, XLSX, or XLS spreadsheet.`);
      return;
    }

    try {
      setIsUploading(true);
      setProgressStatus("Uploading dataset file...");
      
      const meta = await DatasetApi.uploadDataset(file);
      setProgressStatus("Analyzing schemas, calculating column types & distributions...");
      
      setDatasetId(meta.dataset_id);
      setMetadata(meta);

      setProgressStatus("Complete! Redirecting to Overview Dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail ||
          "Failed to process dataset. Please ensure the file is valid and readable."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--text-primary)" }}>
          Universal Dataset Ingestion Engine
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Upload any structured CSV or Excel dataset. The platform automatically determines
          schema types, statistical distributions, quality metrics, and recommended visualisations.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-sky-500 bg-sky-500/10 scale-[1.01]"
            : "hover:border-slate-500"
        } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
        style={isDragging ? undefined : { borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-12 w-12 text-sky-400 animate-spin" />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Ingesting & Processing Dataset</h3>
            <p className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{progressStatus}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Drag and drop your file here, or <span className="text-sky-400 underline">browse</span>
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Supports CSV (automatic delimiter detection) and Excel (.xlsx, .xls) files up to 150MB
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> CSV / XLSX
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                <Database className="h-3.5 w-3.5 text-sky-400" /> Up to 100k+ rows
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Non-destructive Ingestion
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Architectural Guarantees Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="rounded-xl border p-5 space-y-2" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Database className="h-4 w-4" /> Zero Fixed Schemas
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            The engine dynamically maps arbitrary column headers, identifying numerical, categorical,
            date-time, and boolean series automatically.
          </p>
        </div>
        <div className="rounded-xl border p-5 space-y-2" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <BarChart4 className="h-4 w-4" /> Algorithmic Visualisations
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Recommends optimal bivariate and multivariate chart designs based on distributional
            properties, cardinality, and data completeness.
          </p>
        </div>
        <div className="rounded-xl border p-5 space-y-2" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <ShieldCheck className="h-4 w-4" /> Transparent Science
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Every insight provides exact statistical evidence, Pearson/Spearman coefficients, and IQR
            bounds without ungrounded hallucinations.
          </p>
        </div>
      </div>
    </div>
  );
}
