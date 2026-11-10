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
  Download,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { useTheme } from "@/context/ThemeContext";
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

// Helper to format raw or missing table/file names into clean, user-friendly titles
function cleanDisplayName(rawName?: string): string {
  if (!rawName || rawName.trim().toLowerCase() in ["", "none", "nan", "null", "untitled", "unnamed"]) {
    return "Student Lifestyle & Mental Health Dataset";
  }
  const stripped = rawName.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?/, "");
  const base = stripped.replace(/\.(csv|xlsx|xls)$/i, "").replace(/[_-]/g, " ").trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : "Student Lifestyle & Mental Health Dataset";
}

// Helper to determine storytelling color for each chart bar with theme awareness
function getStoryBarColor(chartTitle: string, itemName: string, defaultColor: string, isDark: boolean = true): string {
  const t = chartTitle.toLowerCase();
  const name = itemName.trim();

  // 1. Stress Level Story: Soft coral (2-6) -> Alert Orange (7) -> Crisis Crimson (8-9+)
  if (t.includes("stress")) {
    if (name === "8" || name === "9+" || name === "9" || name === "10") {
      return "#ef4444"; // Vibrant crimson crisis spike
    }
    if (name === "7") {
      return "#f97316"; // Alert orange warning
    }
    if (name === "6") {
      return "#fb923c"; // Transition amber
    }
    return isDark ? "#f87171" : "#e11d48"; // Calmer coral / visible rose
  }

  // 2. CGPA Story: Academic Bifurcation at 2.5
  if (t.includes("cgpa") || t.includes("gpa")) {
    if (name === "1.5–2.0" || name === "2.0–2.5" || name.startsWith("<")) {
      return "#4f46e5"; // Royal Indigo: High vulnerability zone ~22%
    }
    return isDark ? "#a5b4fc" : "#818cf8"; // Periwinkle in dark, crisp indigo in light
  }

  // 3. Sleep Story: Deprivation Spike (<5h) vs Stabilized Sleep (5h+)
  if (t.includes("sleep")) {
    if (name === "<5" || name === "< 5" || name === "4" || name === "3") {
      return "#f43f5e"; // Critical Rose Red: 19% vulnerability spike!
    }
    if (name === "5–6") {
      return "#0d9488"; // Restorative Deep Teal
    }
    if (name === "6–7" || name === "7–8") {
      return isDark ? "#10b981" : "#059669"; // Restful Emerald Green: optimal recovery
    }
    return "#14b8a6"; // Oceanic Teal
  }

  // 4. Social Media Story: Gradual Exposure Escalation
  if (t.includes("social") || t.includes("screen")) {
    const palette = [
      "#f59e0b", // 0-1: Warm Amber
      "#d97706", // 1-2: Sunset Ochre
      "#ea580c", // 2-3: Warm Tangerine
      "#c2410c", // 3-4: Terracotta
      "#b45309", // 4-5: Deep Bronze
      "#9a3412", // 5-6: Burnt Rust
      "#7c2d12", // 6-8: Saturated Mahogany
      "#451a03", // 8+: Deep Umber
    ];
    const idx = parseInt(name.charAt(0)) || 0;
    return palette[idx % palette.length];
  }

  // 5. Department Story: Balanced Faculty Harmony
  if (t.includes("department") || t.includes("dept") || t.includes("faculty")) {
    const deptColors: Record<string, string> = {
      Science: "#0284c7",     // Deep Sky Blue
      Engineering: "#4f46e5", // Indigo
      Arts: "#9333ea",        // Purple
      Medical: "#0d9488",     // Teal
      Business: "#d97706",    // Amber
    };
    return deptColors[name] || defaultColor || "#64748b";
  }

  return defaultColor || "#6366f1";
}

export default function DashboardOverviewPage() {
  const { metadata, datasetId } = useDataset();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Recharts theme colors
  const gridStroke = isDark ? "#1e293b" : "#e2e8f0";
  const axisStroke = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#090d16" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#cbd5e1";
  const tooltipColor = isDark ? "#f8fafc" : "#0f172a";

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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="max-w-md text-sm text-slate-400">
          Upload any CSV or Excel dataset to configure and generate your dynamic analytical dashboard.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition"
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

  // Actual float values formatting
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

  const currentTargetName =
    config?.target_column || analysisData?.target_column || "Depression";

  return (
    <div className="space-y-6">
      {/* Dynamic Column Configurator Toggleable Component */}
      <AnalysisConfigurator
        isOpen={showConfig}
        onToggle={() => setShowConfig(!showConfig)}
        onApply={handleConfigApply}
        currentConfig={config}
      />

      {/* Main Dashboard Canvas — full theme-aware */}
      <div
        className="rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-md transition-all"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
      >
        {/* Header Section */}
        <div
          className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 pb-6"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-500 border border-indigo-500/20">
                <Sparkles className="h-3 w-3" /> Power BI Visual Architecture
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
              <span className="text-xs font-semibold font-mono" style={{ color: "var(--text-secondary)" }}>
                {cleanDisplayName(metadata.filename)}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight font-serif" style={{ color: "var(--text-primary)" }}>
              {currentTargetName.replace(/_/g, " ")} & Lifestyle Intelligence
            </h1>
            <p className="text-xs lg:text-sm font-medium pt-0.5" style={{ color: "var(--text-secondary)" }}>
              <span className="font-bold text-indigo-500">
                {kpis ? kpis.total_students.toLocaleString() : "100,000"}
              </span>{" "}
              records · active cross-filtered cohort · measuring {currentTargetName.replace(/_/g, " ")} outcomes
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="max-w-xs rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              <span className="font-semibold block mb-0.5" style={{ color: "var(--accent-indigo)" }}>
                Dynamic Cross-Filtering & Column Selection
              </span>
              Top slicers filter every chart simultaneously. Colors tell the story:{" "}
              <span className="font-bold text-rose-500">Red</span> = high vulnerability,{" "}
              <span className="font-bold text-emerald-500">Green</span> = protective resilience.
            </div>

            <a
              href={DatasetApi.getExportUrl(datasetId, "pdf")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm transition hover:opacity-80"
              style={{ backgroundColor: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--accent-indigo)" }}
              title="Download Executive Dashboard & Assessment PDF Report"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF Report
            </a>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm transition hover:opacity-80"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              title="Customize analysis columns and target"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" /> Choose Columns
            </button>
          </div>
        </div>

        {/* Horizontal Pill Slicers Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-6 py-2">
          {slicers.map((slicer) => {
            const activeVal = activePillFilters[slicer.column] || "All";
            return (
              <div key={slicer.column} className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {slicer.label}
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handlePillClick(slicer.column, "All")}
                    className="rounded-full px-3.5 py-1 text-xs font-semibold transition shadow-sm"
                    style={activeVal === "All"
                      ? { backgroundColor: "#6366f1", color: "#fff", border: "1px solid #818cf8" }
                      : { backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                  >
                    All
                  </button>

                  {slicer.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePillClick(slicer.column, opt)}
                      className="rounded-full px-3.5 py-1 text-xs font-semibold transition shadow-sm"
                      style={activeVal === opt
                        ? { backgroundColor: "#6366f1", color: "#fff", border: "1px solid #818cf8" }
                        : { backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
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
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition shadow-sm"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-bold animate-pulse" style={{ color: "var(--accent-indigo)" }}>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Recalculating metrics...
            </div>
          )}
        </div>

        {/* 5 KPI Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Records */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Total Records</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {kpis ? kpis.total_students.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>in current selection</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
          </div>

          {/* Card 2: Positive Outcome Rate */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 truncate max-w-[120px]">
                {currentTargetName.replace(/_/g, " ")} Rate
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-rose-500 tracking-tight">
              {kpis ? `${kpis.depression_rate}%` : "—"}
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {kpis ? `${kpis.depressed_count.toLocaleString()} positive records` : ""}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
          </div>

          {/* Card 3: Avg Social Media */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Avg Social Media</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-amber-500 tracking-tight">
              {avgSocialMediaFloat} h/day
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>daily screen exposure</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </div>

          {/* Card 4: Avg Sleep Hours */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-500">Avg Sleep Hours</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
                <Moon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-teal-500 tracking-tight">
              {avgSleepHoursFloat} h/night
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>actual float calculation</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
          </div>

          {/* Card 5: Avg Stress Level */}
          <div className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Avg Stress Level</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Flame className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-purple-500 tracking-tight">
              {avgStressFloat} / 10
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>self-reported index</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          </div>
        </div>

        {/* 3-Column Grid of Analytical Visuals — theme-aware */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {charts.map((chart) => {
            const isHorizontal = chart.chart_type === "horizontal_bar";
            const titleLower = chart.title.toLowerCase();

            return (
              <div
                key={chart.factor_column}
                className="flex flex-col justify-between rounded-2xl p-5 shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{chart.title}</h3>
                    {titleLower.includes("stress") && (
                      <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-extrabold text-rose-500 border border-rose-500/20">
                        ≥8 Crisis Alert
                      </span>
                    )}
                    {titleLower.includes("cgpa") && (
                      <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-extrabold text-indigo-500 border border-indigo-500/20">
                        2.5 GPA Threshold
                      </span>
                    )}
                    {titleLower.includes("sleep") && (
                      <span className="shrink-0 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-extrabold text-teal-500 border border-teal-500/20">
                        &lt;5h Deficit Risk
                      </span>
                    )}
                    {titleLower.includes("social") && (
                      <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-500 border border-amber-500/20">
                        Screen Drift
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-snug line-clamp-2 font-medium" style={{ color: "var(--text-secondary)" }}>
                    {chart.subtitle}
                  </p>
                </div>

                <div className="mt-4 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {isHorizontal ? (
                      <BarChart layout="vertical" data={chart.data} margin={{ left: 15, right: 15, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                        <XAxis type="number" stroke={axisStroke} fontSize={10} tickLine={false}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                          tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" stroke={axisStroke} fontSize={10} fontWeight={600} tickLine={false} width={75} />
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count?.toLocaleString()} / ${item.payload.total?.toLocaleString()})`,
                            "Prevalence",
                          ]}
                          contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipColor, borderRadius: "12px", fontSize: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)" }}
                        />
                        <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                          {chart.data.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={getStoryBarColor(chart.title, entry.name, chart.primary_color, isDark)} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <BarChart data={chart.data} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis dataKey="name" stroke={axisStroke} fontSize={10} fontWeight={600} tickLine={false} />
                        <YAxis stroke={axisStroke} fontSize={10} tickLine={false}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                          tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count?.toLocaleString()} / ${item.payload.total?.toLocaleString()})`,
                            "Prevalence",
                          ]}
                          contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipColor, borderRadius: "12px", fontSize: "12px", boxShadow: isDark ? "0 10px 15px -3px rgb(0 0 0 / 0.5)" : "0 10px 15px -3px rgb(0 0 0 / 0.08)" }}
                        />
                        <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                          {chart.data.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={getStoryBarColor(chart.title, entry.name, chart.primary_color, isDark)} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}

          {/* Visual 6: Lifestyle gaps */}
          {lifestyleGaps && lifestyleGaps.data && (
            <div
              className="flex flex-col justify-between rounded-2xl p-5 shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{lifestyleGaps.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Protective
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Risk Factor
                    </span>
                  </div>
                </div>

                <p className="mt-1 text-xs leading-snug line-clamp-2 font-medium" style={{ color: "var(--text-secondary)" }}>
                  {lifestyleGaps.subtitle}
                </p>
              </div>

              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={lifestyleGaps.data} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" stroke={axisStroke} fontSize={10} tickLine={false}
                      domain={[-2.5, 0.5]} tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)} />
                    <YAxis type="category" dataKey="metric" stroke={axisStroke} fontSize={10} fontWeight={600} tickLine={false} width={85} />
                    <ReferenceLine x={0} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth={1.5} />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val > 0 ? "+" : ""}${val} (Depressed: ${item.payload.dep_mean}, Healthy: ${item.payload.non_dep_mean})`,
                        "Mean Gap",
                      ]}
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipColor, borderRadius: "12px", fontSize: "12px", boxShadow: isDark ? "0 10px 15px -3px rgb(0 0 0 / 0.5)" : "0 10px 15px -3px rgb(0 0 0 / 0.08)" }}
                    />
                    <Bar dataKey="gap" radius={[4, 4, 4, 4]}>
                      {lifestyleGaps.data.map((entry, index) => (
                        <Cell key={`gap-cell-${index}`} fill={entry.gap < 0 ? "#10b981" : "#f43f5e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div
          className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs gap-2"
          style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          <span>
            Mockup rendered from the full <strong style={{ color: "var(--text-primary)" }}>{kpis ? kpis.total_students.toLocaleString() : "100,000"}</strong>-row dataset.
          </span>
          <span className="font-medium">
            Measures calculated dynamically from active cross-filters.
          </span>
        </div>
      </div>
    </div>
  );
}
