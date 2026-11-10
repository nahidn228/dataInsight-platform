"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Layers,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";

export default function ReportsPage() {
  const { metadata, datasetId } = useDataset();
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>No Dataset Active</h2>
        <p className="max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
          Upload a dataset to generate publication-ready PDF reports and download cleaned datasets.
        </p>
        <Link
          href="/upload"
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sky-500 transition"
        >
          Upload Dataset
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <FileSpreadsheet className="h-4 w-4" /> Academic & Commercial Export Center
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--text-primary)" }}>
          Analytical Reports & Data Exports
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Generate comprehensive academic assessment documentation (PDF) and export transformed tabular data.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Assessment Report */}
        <div className="rounded-xl border border-sky-500/30 p-6 flex flex-col justify-between space-y-5 shadow-lg shadow-sky-500/5" style={{ backgroundColor: "var(--bg-surface)" }}>
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Academic Assessment Report</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Standardized report incorporating dataset architecture, quality indices, parametric
              statistics tables, evidence-based discoveries, and methodological limitations.
            </p>
          </div>

          <a
            href={DatasetApi.getExportUrl(datasetId, "pdf")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-sky-500 transition"
          >
            <Download className="h-4 w-4" /> Download PDF Report
          </a>
        </div>

        {/* Cleaned CSV Export */}
        <div className="rounded-xl border p-6 flex flex-col justify-between space-y-5 shadow-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Transformed Dataset (CSV)</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Full active dataset with all deduplication, imputation, and IQR filtering operations
              applied in standard UTF-8 CSV format.
            </p>
          </div>

          <a
            href={DatasetApi.getExportUrl(datasetId, "csv")}
            download
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            <Download className="h-4 w-4 text-emerald-400" /> Export Cleaned CSV
          </a>
        </div>

        {/* Cleaned Excel Export */}
        <div className="rounded-xl border p-6 flex flex-col justify-between space-y-5 shadow-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Excel Workbook (.xlsx)</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Export processed dataset directly to Microsoft Excel spreadsheet format ready for offline
              stakeholder review and archival.
            </p>
          </div>

          <a
            href={DatasetApi.getExportUrl(datasetId, "xlsx")}
            download
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            <Download className="h-4 w-4 text-indigo-400" /> Export Cleaned Excel
          </a>
        </div>
      </div>
    </div>
  );
}
