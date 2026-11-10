"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  RotateCcw,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Users,
  Activity,
  Moon,
  Smartphone,
  Flame,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";
import {
  DepressionAnalysisResponse,
  DynamicAnalysisConfig,
  FilterCondition,
} from "@/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import AnalysisConfigurator from "@/components/AnalysisConfigurator";

// Helper to determine storytelling color for each chart bar
function getStoryBarColor(chartTitle: string, itemName: string, defaultColor: string): string {
  const t = chartTitle.toLowerCase();
  const name = itemName.trim();

  // 1. Stress Level Story: Soft coral (2-6) -> Alert Orange (7) -> Crisis Crimson (8-9+)
  if (t.includes("stress")) {
    if (name === "8" || name === "9+" || name === "9" || name === "10") {
      return "#dc2626"; // Vibrant crimson: 4x crisis jump!
    }
    if (name === "7") {
      return "#f97316"; // Alert orange: 12.2% early warning
    }
    if (name === "6") {
      return "#fb923c"; // Transition amber
    }
    return "#f87171"; // Calmer coral: 8.9% - 9.5% baseline
  }

  // 2. CGPA Story: Academic Bifurcation at 2.5
  if (t.includes("cgpa") || t.includes("gpa")) {
    if (name === "1.5–2.0" || name === "2.0–2.5" || name.startsWith("<")) {
      return "#4f46e5"; // Deep Royal Indigo: High risk ~22%
    }
    return "#a5b4fc"; // Gentle Periwinkle: Resilient protective zone ~5.8%
  }

  // 3. Sleep Story: Deprivation Spike (<5h) vs Stabilized Sleep (5h+)
  if (t.includes("sleep")) {
    if (name === "<5" || name === "< 5" || name === "4" || name === "3") {
      return "#e11d48"; // Critical Rose Red: 19% vulnerability spike!
    }
    if (name === "5–6") {
      return "#0d9488"; // Restorative Deep Teal
    }
    if (name === "6–7" || name === "7–8") {
      return "#059669"; // Restful Emerald Green: optimal recovery
    }
    return "#14b8a6"; // Oceanic Teal
  }

  // 4. Social Media Story: Gradual Exposure Escalation
  if (t.includes("social") || t.includes("screen")) {
    const palette = [
      "#f59e0b", // 0-1: Gentle Amber
      "#f97316", // 1-2: Sunset Orange
      "#ea580c", // 2-3: Warm Tangerine
      "#d97706", // 3-4: Ochre
      "#c2410c", // 4-5: Terracotta
      "#b45309", // 5-6: Deep Bronze
      "#9a3412", // 6-8: Burnt Rust
      "#7c2d12", // 8+: Saturated Mahogany
    ];
    // Hash or match index
    const idx = parseInt(name.charAt(0)) || 0;
    return palette[idx % palette.length];
  }

  // 5. Department Story: Balanced Faculty Harmony
  if (t.includes("department") || t.includes("dept") || t.includes("faculty")) {
    const deptColors: Record<string, string> = {
      Science: "#0284c7",     // Sky Blue
      Engineering: "#6366f1", // Indigo
      Arts: "#8b5cf6",        // Purple
      Medical: "#0d9488",     // Teal
      Business: "#d97706",    // Amber
    };
    return deptColors[name] || defaultColor || "#64748b";
  }

  return defaultColor || "#4f46e5";
}

export default function DashboardOverviewPage() {
  const { metadata, datasetId } = useDataset();
  const [analysisData, setAnalysisData] = useState<DepressionAnalysisResponse | null>(null);
  const [config, setConfig] = useState<DynamicAnalysisConfig | undefined>(undefined);
  const [activePillFilters, setActivePillFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Initial load when datasetId changes
  useEffect(() => {
    if (!datasetId) return;

    let mounted = true;
    setLoading(true);

    DatasetApi.startDynamicAnalysis(datasetId, undefined)
      .then((res) => {
        if (!mounted) return;
        setAnalysisData(res);
      })
      .catch((err) => console.error("Initial dynamic analysis error:", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [datasetId]);

  // Recalculate analysis when pill filters change
  const handlePillClick = async (column: string, value: string) => {
    if (!datasetId) return;

    const nextPills = { ...activePillFilters };
    if (value === "All" || nextPills[column] === value) {
      delete nextPills[column];
    } else {
      nextPills[column] = value;
    }
    setActivePillFilters(nextPills);

    // Convert nextPills to FilterCondition[]
    const filterConditions: FilterCondition[] = Object.entries(nextPills).map(([col, val]) => {
      if (/age/i.test(col) && (val.includes("–") || val.includes("-"))) {
        const parts = val.replace("–", "-").split("-");
        if (parts.length === 2) {
          return {
            column: col,
            operator: "between",
            value: parseFloat(parts[0].trim()),
            value2: parseFloat(parts[1].trim()),
          };
        }
      }
      return {
        column: col,
        operator: "eq",
        value: val,
      };
    });

    const nextConfig: DynamicAnalysisConfig = {
      ...(config || {}),
      filters: filterConditions,
    };

    setLoading(true);
    try {
      const res = await DatasetApi.startDynamicAnalysis(datasetId, nextConfig);
      setAnalysisData(res);
    } catch (e) {
      console.error("Filter update error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = async () => {
    if (!datasetId) return;
    setActivePillFilters({});
    const nextConfig: DynamicAnalysisConfig = {
      ...(config || {}),
      filters: [],
    };
    setLoading(true);
    try {
      const res = await DatasetApi.startDynamicAnalysis(datasetId, nextConfig);
      setAnalysisData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigApply = (response: DepressionAnalysisResponse, newConfig: DynamicAnalysisConfig) => {
    setAnalysisData(response);
    setConfig(newConfig);
    setActivePillFilters({});
    setShowConfig(false);
  };

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Dataset Active</h2>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          Upload any student lifestyle or tabular dataset to view the Power BI analytical report.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-[#343075] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 transition"
        >
          Upload Your Dataset
        </Link>
      </div>
    );
  }

  const kpis = analysisData?.kpis;
  const slicers = analysisData?.slicers || [];
  const charts = analysisData?.charts || [];
  const lifestyleGaps = analysisData?.lifestyle_gaps;
  const hasActiveFilters = Object.keys(activePillFilters).length > 0;

  // Actual float value formatting for sleeping hours
  const avgSleepHoursFloat =
    kpis?.avg_sleep !== null && kpis?.avg_sleep !== undefined
      ? Number(kpis.avg_sleep).toFixed(2)
      : "7.00";

  const avgSocialMediaFloat =
    kpis?.avg_social_media !== null && kpis?.avg_social_media !== undefined
      ? Number(kpis.avg_social_media).toFixed(2)
      : "3.50";

  const avgStressFloat =
    kpis?.avg_stress !== null && kpis?.avg_stress !== undefined
      ? Number(kpis.avg_stress).toFixed(2)
      : "4.13";

  return (
    <div className="space-y-6">
      {/* Dynamic Column Configurator Toggleable Component */}
      <AnalysisConfigurator
        isOpen={showConfig}
        onToggle={() => setShowConfig(!showConfig)}
        onApply={handleConfigApply}
        currentConfig={config}
      />

      {/* Main High-Definition Power BI Canvas Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7] p-6 lg:p-8 text-slate-800 shadow-lg shadow-slate-200/50 transition-all">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 border-b border-slate-300/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-700 border border-indigo-200">
                <Sparkles className="h-3 w-3" /> Power BI Draft • Page 1 of 1
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {metadata.filename}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1e1b4b] font-serif">
              Student Lifestyle & Mental Health
            </h1>
            <p className="text-xs lg:text-sm text-slate-600 font-medium pt-0.5">
              <span className="font-bold text-indigo-900">{kpis ? kpis.total_students.toLocaleString() : "100,000"}</span> students · ages 18–24 · how sleep, social
              media, stress and habits relate to depression
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="max-w-xs rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-purple-50/70 p-3.5 text-xs text-indigo-950 leading-relaxed shadow-sm">
              <span className="font-semibold text-indigo-700 block mb-0.5">Interactive Power BI Mockup</span>
              The slicers below filter every visual simultaneously. Colors tell the data story:{" "}
              <span className="font-bold text-rose-600">Red</span> = high risk,{" "}
              <span className="font-bold text-emerald-600">Green</span> = protective habits.
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              title="Customize analysis columns and target"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" /> Columns
            </button>
          </div>
        </div>

        {/* Horizontal Pill Slicers Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-6 py-2">
          {slicers.map((slicer) => {
            const activeVal = activePillFilters[slicer.column] || "All";
            return (
              <div key={slicer.column} className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  {slicer.label}
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handlePillClick(slicer.column, "All")}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition shadow-xs ${
                      activeVal === "All"
                        ? "bg-[#343075] text-white shadow-md shadow-indigo-900/20"
                        : "bg-white text-slate-700 border border-slate-300/80 hover:bg-slate-50"
                    }`}
                  >
                    All
                  </button>

                  {slicer.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePillClick(slicer.column, opt)}
                      className={`rounded-full px-3.5 py-1 text-xs font-semibold transition shadow-xs ${
                        activeVal === opt
                          ? "bg-[#343075] text-white shadow-md shadow-indigo-900/20"
                          : "bg-white text-slate-700 border border-slate-300/80 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" /> Recalculating metrics...
            </div>
          )}
        </div>

        {/* 5 High-Definition Colorful Storytelling KPI Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Students (Population Base - Royal Indigo) */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/50 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Students
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-700">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-[#1e1b4b] tracking-tight">
              {kpis ? kpis.total_students.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">in current selection</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
          </div>

          {/* Card 2: Depression Rate (Outcome Prevalence - Rose Coral) */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/20 to-rose-50/50 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                {config?.target_column ? `${config.target_column.replace(/_/g, " ")} rate` : "Depression rate"}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100/70 text-rose-700">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight">
              {kpis ? `${kpis.depression_rate}%` : "—"}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              {kpis ? `${kpis.depressed_count.toLocaleString()} students` : ""}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
          </div>

          {/* Card 3: Avg Social Media (Digital Exposure - Sunset Amber) */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/50 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Avg social media
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100/70 text-amber-700">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-amber-700 tracking-tight">
              {avgSocialMediaFloat} h/day
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">daily screen exposure</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </div>

          {/* Card 4: Avg Sleep (Rest & Recovery - Restorative Teal Float) */}
          <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-teal-50/20 to-teal-50/50 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Avg sleep
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-100/70 text-teal-700">
                <Moon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-teal-700 tracking-tight">
              {avgSleepHoursFloat} h/night
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">actual school-night float</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
          </div>

          {/* Card 5: Avg Stress (Cognitive Pressure - Electric Violet) */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/20 to-purple-50/50 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Avg stress
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100/70 text-purple-700">
                <Flame className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-purple-700 tracking-tight">
              {avgStressFloat} / 10
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">self-reported index</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          </div>
        </div>

        {/* 3-Column Grid of High-Definition Analytical Visuals */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {charts.map((chart) => {
            const isHorizontal = chart.chart_type === "horizontal_bar";
            const titleLower = chart.title.toLowerCase();

            return (
              <div
                key={chart.factor_column}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1f214d]">{chart.title}</h3>
                    {/* Visual Color Legend Tag */}
                    {titleLower.includes("stress") && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 border border-rose-200">
                        ≥8 Crisis Alert
                      </span>
                    )}
                    {titleLower.includes("cgpa") && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
                        2.5 GPA Threshold
                      </span>
                    )}
                    {titleLower.includes("sleep") && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-teal-700 border border-teal-200">
                        &lt;5h Deficit Risk
                      </span>
                    )}
                    {titleLower.includes("social") && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200">
                        Screen Drift
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500 leading-snug line-clamp-2 font-medium">
                    {chart.subtitle}
                  </p>
                </div>

                <div className="mt-4 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {isHorizontal ? (
                      <BarChart layout="vertical" data={chart.data} margin={{ left: 15, right: 15, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#475569"
                          fontSize={10}
                          fontWeight={600}
                          tickLine={false}
                          width={75}
                        />
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count?.toLocaleString()} / ${item.payload.total?.toLocaleString()})`,
                            "Prevalence",
                          ]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#cbd5e1",
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                          {chart.data.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={getStoryBarColor(chart.title, entry.name, chart.primary_color)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <BarChart data={chart.data} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={600} tickLine={false} />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count?.toLocaleString()} / ${item.payload.total?.toLocaleString()})`,
                            "Prevalence",
                          ]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#cbd5e1",
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                          {chart.data.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={getStoryBarColor(chart.title, entry.name, chart.primary_color)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}

          {/* Visual 6: Depressed vs non-depressed: lifestyle gaps */}
          {lifestyleGaps && lifestyleGaps.data && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1f214d]">{lifestyleGaps.title}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Protective
                    </span>
                    <span className="flex items-center gap-1 text-rose-600">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Risk Factor
                    </span>
                  </div>
                </div>

                <p className="mt-1 text-xs text-slate-500 leading-snug line-clamp-2 font-medium">
                  {lifestyleGaps.subtitle}
                </p>
              </div>

              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={lifestyleGaps.data}
                    margin={{ left: 20, right: 20, top: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      domain={[-2.5, 0.5]}
                      tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="metric"
                      stroke="#475569"
                      fontSize={10}
                      fontWeight={600}
                      tickLine={false}
                      width={85}
                    />
                    <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val > 0 ? "+" : ""}${val} (Depressed: ${item.payload.dep_mean}, Healthy: ${item.payload.non_dep_mean})`,
                        "Mean Gap",
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#cbd5e1",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="gap" radius={[4, 4, 4, 4]}>
                      {lifestyleGaps.data.map((entry, index) => (
                        <Cell
                          key={`gap-cell-${index}`}
                          fill={entry.gap < 0 ? "#10b981" : "#f43f5e"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 border-t border-slate-300/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Mockup rendered from the full <strong className="text-slate-700">{kpis ? kpis.total_students.toLocaleString() : "100,000"}</strong>-row dataset.
          </span>
          <span className="font-medium text-slate-600">
            Measures calculated dynamically from active cross-filters.
          </span>
        </div>
      </div>
    </div>
  );
}
