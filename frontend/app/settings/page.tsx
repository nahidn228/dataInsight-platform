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
      <div className="border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 text-xs text-sky-400">
          <SettingsIcon className="h-4 w-4" /> System Preferences & Architecture
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--text-primary)" }}>
          Platform Settings & Environment
        </h1>
      </div>

      <div className="space-y-6">
        {/* Session Management */}
        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Active Session Storage</h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
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
            <div className="rounded-lg p-4 text-xs font-mono space-y-1" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
              <div>Session ID: {metadata.dataset_id}</div>
              <div>File Source: {metadata.filename}</div>
              <div>Row Capacity: {metadata.total_rows.toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-xs italic" style={{ color: "var(--text-muted)" }}>No session active.</div>
          )}
        </div>

        {/* Academic Module Meta */}
        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Coursework & Architecture Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: "var(--bg-base)" }}>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Institution</span>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Birmingham City University (BCU)</p>
            </div>
            <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: "var(--bg-base)" }}>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Module</span>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>CMP7227 – Data Visualisation (2026/2027)</p>
            </div>
            <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: "var(--bg-base)" }}>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Engine Model</span>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Deterministic Statistical Inference (Zero AI Cost)</p>
            </div>
            <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: "var(--bg-base)" }}>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Visualization Engine</span>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Recharts + Plotly Server Core</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
