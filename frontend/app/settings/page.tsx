"use client";

import React from "react";
import { Settings as SettingsIcon, Database, Trash2, Cpu, Globe, Shield } from "lucide-react";
import { useDataset } from "@/context/DatasetContext";

export default function SettingsPage() {
  const { datasetId, setDatasetId, metadata } = useDataset();

  const handleClearSession = () => {
    setDatasetId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs text-sky-400">
          <SettingsIcon className="h-4 w-4" /> System Preferences & Architecture
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
          Platform Settings & Environment
        </h1>
      </div>

      <div className="space-y-6">
        {/* Session Management */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Active Session Storage</h3>
              <p className="text-xs text-slate-400">
                DataInsight manages session contexts in memory and server-isolated scratch directories.
              </p>
            </div>
            {datasetId && (
              <button
                onClick={handleClearSession}
                className="flex items-center gap-1.5 rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Disconnect Active Dataset
              </button>
            )}
          </div>

          {metadata ? (
            <div className="rounded-lg bg-slate-950 p-4 text-xs font-mono text-slate-300 space-y-1">
              <div>Session ID: {metadata.dataset_id}</div>
              <div>File Source: {metadata.filename}</div>
              <div>Row Capacity: {metadata.total_rows.toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">No session active.</div>
          )}
        </div>

        {/* Academic Module Meta */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-base font-semibold text-white">Coursework & Architecture Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg bg-slate-950 p-4 space-y-1">
              <span className="text-slate-500 font-medium">Institution</span>
              <p className="text-slate-200 font-semibold">Birmingham City University (BCU)</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-4 space-y-1">
              <span className="text-slate-500 font-medium">Module</span>
              <p className="text-slate-200 font-semibold">CMP7227 – Data Visualisation (2026/2027)</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-4 space-y-1">
              <span className="text-slate-500 font-medium">Engine Model</span>
              <p className="text-slate-200 font-semibold">Deterministic Statistical Inference (Zero AI Cost)</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-4 space-y-1">
              <span className="text-slate-500 font-medium">Visualization Engine</span>
              <p className="text-slate-200 font-semibold">Recharts + Plotly Server Core</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

