"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Search,
  Database,
  ArrowRight,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";
import { OverallStatistics } from "@/types";

export default function StatisticsPage() {
  const { metadata, datasetId } = useDataset();
  const [stats, setStats] = useState<OverallStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchNum, setSearchNum] = useState("");
  const [activeTab, setActiveTab] = useState<"numerical" | "categorical" | "correlations">("numerical");

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    DatasetApi.getStatistics(datasetId)
      .then((data) => setStats(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [datasetId]);

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="max-w-md text-sm text-slate-400">
          Upload a dataset to compute descriptive statistics, skewness, kurtosis, and correlation matrices.
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400">
            <BarChart3 className="h-4 w-4" /> Algorithmic Statistical Engine
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Descriptive & Multivariate Statistics
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab("numerical")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "numerical" ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Numerical ({stats ? Object.keys(stats.numerical_stats).length : 0})
          </button>
          <button
            onClick={() => setActiveTab("categorical")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "categorical" ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Categorical ({stats ? Object.keys(stats.categorical_stats).length : 0})
          </button>
          <button
            onClick={() => setActiveTab("correlations")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "correlations" ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Correlations ({stats ? stats.correlations.length : 0})
          </button>
        </div>
      </div>

      {/* Tab: Numerical Statistics Table */}
      {activeTab === "numerical" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Parametric & Non-Parametric Measures</h3>
            <span className="text-xs text-slate-400 font-mono">Calculated over full active sample</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Column</th>
                  <th className="py-2.5 px-3">Mean</th>
                  <th className="py-2.5 px-3">Std Dev</th>
                  <th className="py-2.5 px-3">Min</th>
                  <th className="py-2.5 px-3">Q25</th>
                  <th className="py-2.5 px-3">Median</th>
                  <th className="py-2.5 px-3">Q75</th>
                  <th className="py-2.5 px-3">Max</th>
                  <th className="py-2.5 px-3">IQR</th>
                  <th className="py-2.5 px-3">Skewness</th>
                  <th className="py-2.5 px-3">Kurtosis</th>
                  <th className="py-2.5 px-3">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {stats &&
                  Object.entries(stats.numerical_stats).map(([col, ns]) => (
                    <tr key={col} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-white font-sans">{col}</td>
                      <td className="py-2.5 px-3">{ns.mean ?? "-"}</td>
                      <td className="py-2.5 px-3">{ns.std ?? "-"}</td>
                      <td className="py-2.5 px-3">{ns.min ?? "-"}</td>
                      <td className="py-2.5 px-3">{ns.q25 ?? "-"}</td>
                      <td className="py-2.5 px-3 text-sky-400 font-bold">{ns.median ?? "-"}</td>
                      <td className="py-2.5 px-3">{ns.q75 ?? "-"}</td>
                      <td className="py-2.5 px-3">{ns.max ?? "-"}</td>
                      <td className="py-2.5 px-3">{ns.iqr ?? "-"}</td>
                      <td className="py-2.5 px-3">
                        {ns.skewness !== null ? (
                          <span className={Math.abs(ns.skewness) > 1.5 ? "text-amber-400" : ""}>
                            {ns.skewness}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2.5 px-3">{ns.kurtosis ?? "-"}</td>
                      <td className="py-2.5 px-3">
                        {ns.outliers_count > 0 ? (
                          <span className="text-rose-400">{ns.outliers_count.toLocaleString()}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Categorical Frequencies */}
      {activeTab === "categorical" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats &&
            Object.entries(stats.categorical_stats).map(([col, cs]) => (
              <div key={col} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{col}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {cs.unique_count.toLocaleString()} distinct categories
                    </span>
                  </div>
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400 border border-indigo-500/20">
                    Top: {cs.top_value} ({cs.top_frequency?.toLocaleString()})
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cs.frequencies.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-xs">{f.value}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{f.count.toLocaleString()}</span>
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-sky-500 h-full rounded-full"
                            style={{ width: `${Math.min(f.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-400 font-mono w-10 text-right">
                          {f.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tab: Bivariate Correlation Matrix */}
      {activeTab === "correlations" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white">Pearson & Spearman Coefficients</h3>
            <p className="text-xs text-slate-400">
              Evaluates linear association between numerical feature pairs. Values approaching +1.0
              denote positive linear trends; -1.0 denotes inverse correlation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.correlations.map((c, i) => {
              const p = c.pearson ?? 0;
              const isStrong = Math.abs(p) >= 0.5;
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-4 space-y-2 ${
                    isStrong
                      ? "border-sky-500/30 bg-sky-500/5"
                      : "border-slate-800 bg-slate-950/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate">{c.var1}</span>
                    <span className="text-slate-500">↔</span>
                    <span className="font-semibold text-slate-200 truncate">{c.var2}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono text-xs">
                    <span className="text-slate-400">Pearson r:</span>
                    <span
                      className={`font-bold ${
                        p > 0.5 ? "text-emerald-400" : p < -0.5 ? "text-rose-400" : "text-slate-300"
                      }`}
                    >
                      {c.pearson ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                    <span>Spearman ρ:</span>
                    <span>{c.spearman ?? "-"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

