"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PieChart as PieIcon,
  BarChart2,
  Sliders,
  Download,
  Database,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";
import { ChartRecommendation, ChartDataResponse } from "@/types";
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
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"];

export default function VisualizationsPage() {
  const { metadata, datasetId, activeFilters } = useDataset();
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [activeChartData, setActiveChartData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Builder configuration states
  const [chartType, setChartType] = useState<string>("bar");
  const [xColumn, setXColumn] = useState<string>("");
  const [yColumn, setYColumn] = useState<string>("");
  const [aggregation, setAggregation] = useState<string>("mean");
  const [groupBy, setGroupBy] = useState<string>("");
  const [limit, setLimit] = useState<number>(15);

  useEffect(() => {
    if (!datasetId) return;
    DatasetApi.getChartRecommendations(datasetId).then((recs) => {
      setRecommendations(recs);
      if (recs.length > 0) {
        applyRecommendation(recs[0]);
      }
    });
  }, [datasetId]);

  const applyRecommendation = (rec: ChartRecommendation) => {
    setChartType(rec.chart_type);
    if (rec.x_column) setXColumn(rec.x_column);
    if (rec.y_column) setYColumn(rec.y_column);
    if (rec.aggregation) setAggregation(rec.aggregation);
    if (rec.group_by) setGroupBy(rec.group_by);
  };

  const handleGenerate = async () => {
    if (!datasetId || !xColumn) return;
    setLoading(true);
    try {
      const res = await DatasetApi.generateChart(datasetId, {
        chart_type: chartType,
        x_column: xColumn,
        y_column: yColumn || undefined,
        aggregation: aggregation,
        group_by: groupBy || undefined,
        limit: limit,
        filters: activeFilters.length > 0 ? activeFilters : undefined,
      });
      setActiveChartData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (xColumn && datasetId) {
      handleGenerate();
    }
  }, [chartType, xColumn, yColumn, aggregation, groupBy, limit, activeFilters]);

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="max-w-md text-sm text-slate-400">
          Upload a dataset to build custom interactive visualisations and explore automatic recommendations.
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
            <PieIcon className="h-4 w-4" /> Universal Visualisation Studio
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Interactive Chart Recommendation & Custom Builder
          </h1>
        </div>
      </div>

      {/* Preset Recommendation Pills */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Algorithmic Recommendations:
        </span>
        <div className="flex flex-wrap gap-2">
          {recommendations.map((rec) => (
            <button
              key={rec.chart_id}
              onClick={() => applyRecommendation(rec)}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-500/50 hover:bg-slate-800 transition flex items-center gap-2"
            >
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300 uppercase">
                {rec.chart_type}
              </span>
              <span>{rec.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Custom Configuration Control Panel */}
        <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
            <Sliders className="h-4 w-4 text-sky-400" /> Chart Controls
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="bar">Bar Chart</option>
                <option value="horizontal_bar">Horizontal Bar</option>
                <option value="line">Line / Trend Chart</option>
                <option value="area">Area Chart</option>
                <option value="donut">Donut Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="histogram">Histogram</option>
                <option value="scatter">Scatter Plot</option>
                <option value="box">Box / Quartile Plot</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">X-Axis / Category</label>
              <select
                value={xColumn}
                onChange={(e) => setXColumn(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                {metadata.columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.inferred_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Y-Axis Metric (Optional)</label>
              <select
                value={yColumn}
                onChange={(e) => setYColumn(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="">None (Frequency Count)</option>
                {metadata.numerical_columns.map((c) => (
                  <option key={c} value={c}>
                    {c} (numerical)
                  </option>
                ))}
              </select>
            </div>

            {yColumn && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">Aggregation</label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="mean">Mean (Average)</option>
                  <option value="sum">Sum</option>
                  <option value="median">Median</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                  <option value="count">Count</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-medium mb-1">Top Limit</label>
              <input
                type="number"
                min={5}
                max={50}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-sky-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeChartData?.title || "Dynamic Visualisation"}
                </h3>
                <span className="text-xs text-slate-400">
                  {activeChartData?.x_axis_label} vs {activeChartData?.y_axis_label}
                </span>
              </div>
              {activeChartData?.is_sampled && (
                <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] text-amber-300 font-mono">
                  Sampled 8,000 pts for performance
                </span>
              )}
            </div>
          </div>

          <div className="h-[440px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin text-sky-400" /> Recomputing chart...
              </div>
            ) : activeChartData && activeChartData.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "donut" || chartType === "pie" ? (
                  <RechartsPie>
                    <Pie
                      data={activeChartData.data}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={chartType === "donut" ? 65 : 0}
                      outerRadius={120}
                      paddingAngle={2}
                    >
                      {activeChartData.data.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                      }}
                    />
                  </RechartsPie>
                ) : chartType === "line" ? (
                  <LineChart data={activeChartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                  </LineChart>
                ) : chartType === "area" ? (
                  <AreaChart data={activeChartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                  </AreaChart>
                ) : chartType === "scatter" ? (
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="x" stroke="#64748b" fontSize={11} tickLine={false} name={xColumn} />
                    <YAxis dataKey="y" stroke="#64748b" fontSize={11} tickLine={false} name={yColumn} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Scatter name="Points" data={activeChartData.data} fill="#0ea5e9" opacity={0.6} />
                  </ScatterChart>
                ) : (
                  <BarChart data={activeChartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Select suitable attributes to render chart.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

