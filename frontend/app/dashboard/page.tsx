"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Columns,
  Hash,
  Tags,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  BarChart2,
  PieChart,
  RefreshCw,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";
import { OverallStatistics, DataQualityReport, ChartRecommendation, ChartDataResponse } from "@/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

export default function DashboardOverviewPage() {
  const { metadata, datasetId } = useDataset();
  const [stats, setStats] = useState<OverallStatistics | null>(null);
  const [quality, setQuality] = useState<DataQualityReport | null>(null);
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [chartDataList, setChartDataList] = useState<{ id: string; config: ChartRecommendation; data: ChartDataResponse }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!datasetId) return;

    let mounted = true;
    setLoading(true);

    Promise.all([
      DatasetApi.getStatistics(datasetId),
      DatasetApi.getDataQuality(datasetId),
      DatasetApi.getChartRecommendations(datasetId),
    ])
      .then(async ([statsRes, qualityRes, recsRes]) => {
        if (!mounted) return;
        setStats(statsRes);
        setQuality(qualityRes);
        setRecommendations(recsRes);

        // Fetch top 3 recommended charts data dynamically
        const topRecs = recsRes.slice(0, 3);
        const renderedCharts = await Promise.all(
          topRecs.map(async (rec) => {
            try {
              const res = await DatasetApi.generateChart(datasetId, {
                chart_type: rec.chart_type,
                x_column: rec.x_column || "",
                y_column: rec.y_column,
                group_by: rec.group_by,
                aggregation: rec.aggregation || "count",
              });
              return { id: rec.chart_id, config: rec, data: res };
            } catch (e) {
              return null;
            }
          })
        );

        if (mounted) {
          setChartDataList(renderedCharts.filter(Boolean) as any);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [datasetId]);

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="max-w-md text-sm text-slate-400">
          Upload any CSV or Excel dataset to generate dynamic KPIs, statistical summaries, and
          automatic visualisations.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sky-500 transition-colors"
        >
          Upload Your Dataset
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-400">
              Active Assessment Dataset
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-400">{metadata.filename}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Executive Dashboard & Architecture Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/explorer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            Explore Data Table <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/visualizations"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-sky-500 transition"
          >
            Visualisation Studio <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Records</span>
            <Database className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white tracking-tight">
            {metadata.total_rows.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">100% Dynamic</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Attributes</span>
            <Columns className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white tracking-tight">
            {metadata.total_columns}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {metadata.numerical_columns.length} num • {metadata.categorical_columns.length} cat
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Data Health</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-400 tracking-tight">
            {quality ? `${quality.overall_health_score}/100` : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">Algorithmic Score</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Completeness</span>
            <CheckCircle className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white tracking-tight">
            {stats ? `${stats.completeness_percentage}%` : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {stats ? `${stats.total_missing_cells.toLocaleString()} missing cells` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Duplicate Rows</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white tracking-tight">
            {stats ? stats.duplicate_rows_count.toLocaleString() : "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {stats ? `${stats.duplicate_percentage}% duplicates` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">RAM Footprint</span>
            <Layers className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white tracking-tight">
            {metadata.memory_usage_mb} MB
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">{metadata.file_size_formatted}</p>
        </div>
      </div>

      {/* Dynamic Recommended Visualisations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Algorithmic Chart Recommendations</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Generated via column types & distributions
          </span>
        </div>

        {loading ? (
          <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
              Calculating charts from live dataset...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chartDataList.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-400 border border-sky-500/20">
                      {item.config.chart_type}
                    </span>
                    {item.data.is_sampled && (
                      <span className="text-[10px] text-amber-400 font-mono">Sampled 8k rows</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-1">
                    {item.data.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.config.reason}</p>
                </div>

                <div className="h-52 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {item.config.chart_type === "donut" || item.config.chart_type === "pie" ? (
                      <RechartsPie>
                        <Pie
                          data={item.data.data}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={item.config.chart_type === "donut" ? 42 : 0}
                          outerRadius={68}
                          paddingAngle={2}
                        >
                          {item.data.data.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </RechartsPie>
                    ) : item.config.chart_type === "line" ? (
                      <LineChart data={item.data.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={item.data.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dataset Schema & Detection Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-base font-semibold text-white mb-4">Detected Field Specifications</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Column Name</th>
                <th className="py-2.5 px-3">Detected Type</th>
                <th className="py-2.5 px-3">Non-Null Count</th>
                <th className="py-2.5 px-3">Missing %</th>
                <th className="py-2.5 px-3">Distinct Values</th>
                <th className="py-2.5 px-3">Sample Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {metadata.columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{col.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        col.inferred_type === "numerical"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : col.inferred_type === "categorical"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : col.inferred_type === "datetime"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {col.inferred_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{col.non_null_count.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    {col.null_percentage > 0 ? (
                      <span className="text-amber-400">{col.null_percentage}%</span>
                    ) : (
                      <span className="text-emerald-400">0%</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">{col.unique_count.toLocaleString()}</td>
                  <td className="py-2.5 px-3 truncate max-w-xs text-slate-400">
                    {col.sample_values.slice(0, 3).join(", ")}
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

