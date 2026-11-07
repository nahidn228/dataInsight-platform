"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw,
  Database,
  ArrowRight,
  Info,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";
import { DataQualityReport } from "@/types";

export default function DataQualityPage() {
  const { metadata, datasetId, refreshMetadata } = useDataset();
  const [quality, setQuality] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadQuality = async () => {
    if (!datasetId) return;
    setLoading(true);
    try {
      const data = await DatasetApi.getDataQuality(datasetId);
      setQuality(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuality();
  }, [datasetId]);

  const handleApplyClean = async (op: string, col?: string) => {
    if (!datasetId) return;
    setLoading(true);
    setActionSuccess(null);
    try {
      const res = await DatasetApi.cleanDataset(datasetId, [
        { operation: op, column: col },
      ]);
      setActionSuccess(res.message);
      await refreshMetadata();
      await loadQuality();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!datasetId) return;
    setLoading(true);
    try {
      await DatasetApi.resetDataset(datasetId);
      setActionSuccess("Dataset restored to original unmodified state.");
      await refreshMetadata();
      await loadQuality();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="max-w-md text-sm text-slate-400">
          Upload a dataset to evaluate missing value distributions, duplicates, and outlier profiles.
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Data Integrity & Hygiene Diagnosis
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Data Quality & Cleaning Studio
          </h1>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-sky-400" /> Reset to Original State
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Quality Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">Overall Health Score</span>
          <p className="mt-2 text-3xl font-bold text-emerald-400 tracking-tight">
            {quality ? `${quality.overall_health_score}/100` : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">Weighted Integrity Index</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">Missing Data Cells</span>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">
            {quality ? quality.total_missing.toLocaleString() : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {quality ? `${quality.missing_cells_percentage}% total sparsity` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">Duplicate Rows</span>
          <p className="mt-2 text-3xl font-bold text-amber-400 tracking-tight">
            {quality ? quality.duplicate_rows.toLocaleString() : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {quality ? `${quality.duplicate_rows_percentage}% redundant records` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">Total Evaluated Cells</span>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">
            {quality ? quality.total_cells.toLocaleString() : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            Across {metadata.total_columns} attributes
          </p>
        </div>
      </div>

      {/* Recommended Pre-processing Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-400" /> Automated Quality Recommendations
        </h3>
        <div className="space-y-3">
          {quality?.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-950 p-3.5 text-xs text-slate-300"
            >
              <div className="flex items-center gap-2.5">
                <Info className="h-4 w-4 text-sky-400 shrink-0" />
                <span>{rec}</span>
              </div>
              {rec.includes("duplicate") && (
                <button
                  onClick={() => handleApplyClean("drop_duplicates")}
                  disabled={loading}
                  className="rounded-md bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-500 shrink-0 transition"
                >
                  Drop All Duplicates
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Column Health Analysis Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-base font-semibold text-white mb-4">Column-Level Completeness & Health</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Column</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Completeness</th>
                <th className="py-2.5 px-3">Missing</th>
                <th className="py-2.5 px-3">Outliers (IQR)</th>
                <th className="py-2.5 px-3 text-right">Interactive Cleaning Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {quality?.columns_quality.map((cq) => (
                <tr key={cq.column} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{cq.column}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        cq.data_health_score >= 90
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : cq.data_health_score >= 70
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {cq.data_health_score}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{cq.completeness}%</td>
                  <td className="py-2.5 px-3">
                    {cq.missing_count > 0 ? (
                      <span className="text-amber-400">{cq.missing_count.toLocaleString()}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {cq.outlier_count > 0 ? (
                      <span className="text-rose-400">{cq.outlier_count.toLocaleString()}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5 font-sans">
                    {cq.missing_count > 0 && cq.inferred_type === "numerical" && (
                      <button
                        onClick={() => handleApplyClean("fill_missing_median", cq.column)}
                        disabled={loading}
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-sky-300 hover:bg-slate-700"
                        title="Impute with column median"
                      >
                        Impute Median
                      </button>
                    )}
                    {cq.missing_count > 0 && cq.inferred_type !== "numerical" && (
                      <button
                        onClick={() => handleApplyClean("fill_missing_mode", cq.column)}
                        disabled={loading}
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-sky-300 hover:bg-slate-700"
                        title="Impute with most frequent mode"
                      >
                        Impute Mode
                      </button>
                    )}
                    {cq.outlier_count > 0 && (
                      <button
                        onClick={() => handleApplyClean("remove_outliers_iqr", cq.column)}
                        disabled={loading}
                        className="rounded border border-rose-900 bg-rose-950/40 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-900/60"
                        title="Filter values outside 1.5*IQR"
                      >
                        Trim Outliers
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

