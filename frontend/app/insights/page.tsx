"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightbulb,
  TrendingUp,
  AlertOctagon,
  Layers,
  Link2,
  CheckCircle2,
  Database,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";
import { AnalyticalInsight } from "@/types";

export default function InsightsPage() {
  const { metadata, datasetId } = useDataset();
  const [insights, setInsights] = useState<AnalyticalInsight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    DatasetApi.getInsights(datasetId)
      .then((data) => setInsights(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [datasetId]);

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>No Dataset Active</h2>
        <p className="max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
          Upload a dataset to extract evidence-based findings, anomalies, and multivariate relationships.
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Lightbulb className="h-4 w-4" /> Rule-Based Statistical Inference Engine
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--text-primary)" }}>
            Evidence-Based Analytical Findings
          </h1>
        </div>
      </div>

      {/* Academic Integrity Callout */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-sky-300 flex items-start gap-3">
        <Info className="h-5 w-5 shrink-0 text-sky-400 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5" style={{ color: "var(--text-primary)" }}>Academic Rigour & Methodological Standard</span>
          All insights presented below are derived algorithmically from exact statistical properties of the active
          dataset (IQR anomaly bounds, Pearson coefficients, skewness metrics, and segment ratios). No external LLMs
          or unverified generative inferences are used.
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-xl border p-5 space-y-4 shadow-sm flex flex-col justify-between ${
              insight.importance === "high"
                ? "border-sky-500/40"
                : ""
            }`}
            style={{
              borderColor: insight.importance === "high" ? undefined : "var(--border-subtle)",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    insight.type === "correlation"
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      : insight.type === "anomaly"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : insight.type === "comparison"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  }`}
                >
                  {insight.type}
                </span>

                <span className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>
                  {insight.metric_name}: <strong style={{ color: "var(--text-primary)" }}>{insight.metric_value}</strong>
                </span>
              </div>

              <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{insight.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{insight.description}</p>
            </div>

            {/* Evidence & Supporting Columns */}
            <div className="pt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <span>Fields:</span>
                {insight.supporting_columns.map((c) => (
                  <span key={c} className="rounded px-1.5 py-0.5 font-mono" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                    {c}
                  </span>
                ))}
              </div>

              {insight.suggested_chart_type && (
                <Link
                  href="/visualizations"
                  className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                >
                  View in Studio <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
