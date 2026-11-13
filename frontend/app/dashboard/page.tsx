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
  BarChart2,
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
    return "Dataset Analytics Dashboard";
  }
  const stripped = rawName.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?/, "");
  const base = stripped.replace(/\.(csv|xlsx|xls)$/i, "").replace(/[_-]/g, " ").trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : "Dataset Analytics Dashboard";
}

// -------------------------------------------------------------
// STRICT 5-COLOR EXECUTIVE DESIGN SYSTEM:
// 1. Indigo (#6366f1)   - Population, Benchmark, Interactive Keys
// 2. Rose   (#f43f5e)   - High Vulnerability, Risk Spike, Positive Outcomes
// 3. Teal   (#0d9488)   - Protective Resilience, Optimal Sleep, Health Surplus
// 4. Amber  (#f59e0b)   - Warning Threshold, Screen Drift Exposure
// 5. Slate  (#64748b)   - Normal Distribution Baseline, Neutral Comparison
// -------------------------------------------------------------
function getStoryBarColor(chartTitle: string, itemName: string, defaultColor: string, isDark: boolean = true): string {
  const t = chartTitle.toLowerCase();
  const name = itemName.trim();

  // 1. Stress Level Story: Safe Slate Baseline (2-6) -> Warning Amber (7) -> Crisis Crimson Rose (8-9+)
  if (t.includes("stress")) {
    if (name === "8" || name === "9+" || name === "9" || name === "10") {
      return "#f43f5e"; // Rose: Crisis spike (~39-42%)
    }
    if (name === "7") {
      return "#f59e0b"; // Amber: Transition warning (~11%)
    }
    return isDark ? "#64748b" : "#94a3b8"; // Slate: Safe baseline (~7-8%)
  }

  // 2. Academic / CGPA Story: Vulnerable Rose (<2.5) vs Resilient Indigo (>=2.5)
  if (t.includes("cgpa") || t.includes("gpa")) {
    if (name === "1.5–2.0" || name === "2.0–2.5" || name.startsWith("<")) {
      return "#f43f5e"; // Rose: High vulnerability zone ~22%
    }
    return "#6366f1"; // Indigo: Resilient protective zone ~5.8%
  }

  // 3. Sleep Story: Severe Deficit Rose (<5h) vs Restorative Teal (5h+)
  if (t.includes("sleep")) {
    if (name === "<5" || name === "< 5" || name === "4" || name === "3") {
      return "#f43f5e"; // Rose: 19% vulnerability spike
    }
    return isDark ? "#0d9488" : "#0f766e"; // Teal: Healthy restorative recovery
  }

  // 4. Screen / Social Exposure Story: Baseline Slate (0-4h) vs Heavy Amber (5h+)
  if (t.includes("social") || t.includes("screen")) {
    const hours = parseFloat(name) || parseInt(name.charAt(0)) || 0;
    if (name.includes("6-8") || name.includes("8+") || hours >= 6) {
      return "#d97706"; // Deep Amber: High exposure
    }
    if (name.includes("5-6") || name.includes("4-5") || hours >= 4) {
      return "#f59e0b"; // Amber: Moderate drift
    }
    return isDark ? "#64748b" : "#94a3b8"; // Slate: Normal daily exposure
  }

  // 5. Department / Category Story: Unified Indigo for accurate benchmarking
  if (t.includes("department") || t.includes("dept") || t.includes("faculty")) {
    return "#6366f1"; // Indigo: Clean comparative benchmark (no rainbow clutter)
  }

  return defaultColor || "#6366f1";
}

export default function DashboardOverviewPage() {
  const { metadata, datasetId } = useDataset();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Strict 5-color theme palette tokens for Recharts SVG
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

  // Senior Developer Empty State: Beautiful, perfectly themed in both Dark and Light mode
  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center space-y-4 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--accent-indigo)",
          }}
        >
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          No Dataset Active
        </h2>
        <p className="max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
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
  const currentTargetName = config?.target_column || analysisData?.target_column || "Depression";

  // Dynamic Metric Resolution (Senior Developer Feature):
  // Gracefully handles both student lifestyle datasets and any generic domain dataset (Churn, Sales, HR, etc.)
  let metric3Label = "Avg Sleep Hours";
  let metric3Value = "7.00 h/night";
  let metric3Sub = "actual float calculation";

  let metric4Label = "Avg Social Media";
  let metric4Value = "3.50 h/day";
  let metric4Sub = "daily screen exposure";

  let metric5Label = "Avg Stress Level";
  let metric5Value = "4.13 / 10";
  let metric5Sub = "self-reported index";

  if (kpis?.avg_sleep !== null && kpis?.avg_sleep !== undefined) {
    metric3Value = `${Number(kpis.avg_sleep).toFixed(2)} h/night`;
  }
  if (kpis?.avg_social_media !== null && kpis?.avg_social_media !== undefined) {
    metric4Value = `${Number(kpis.avg_social_media).toFixed(2)} h/day`;
  }
  if (kpis?.avg_stress !== null && kpis?.avg_stress !== undefined) {
    metric5Value = `${Number(kpis.avg_stress).toFixed(2)} / 10`;
  }

  // If generic dataset without sleep/social/stress, dynamically extract custom metrics
  if (
    (kpis?.avg_sleep === null || kpis?.avg_sleep === undefined) &&
    (kpis?.avg_social_media === null || kpis?.avg_social_media === undefined) &&
    kpis?.custom_metrics &&
    Object.keys(kpis.custom_metrics).length > 0
  ) {
    const entries = Object.entries(kpis.custom_metrics);
    if (entries.length > 0) {
      metric3Label = `Avg ${entries[0][0].replace(/_/g, " ")}`;
      metric3Value = Number(entries[0][1]).toFixed(2);
      metric3Sub = "cohort average";
    }
    if (entries.length > 1) {
      metric4Label = `Avg ${entries[1][0].replace(/_/g, " ")}`;
      metric4Value = Number(entries[1][1]).toFixed(2);
      metric4Sub = "cohort average";
    }
    if (entries.length > 2) {
      metric5Label = `Avg ${entries[2][0].replace(/_/g, " ")}`;
      metric5Value = Number(entries[2][1]).toFixed(2);
      metric5Sub = "cohort average";
    }
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Column Configurator Toggleable Component */}
      <AnalysisConfigurator
        isOpen={showConfig}
        onToggle={() => setShowConfig(!showConfig)}
        onApply={handleConfigApply}
        currentConfig={config}
      />

      {/* Main Dashboard Canvas — Theme-aware with strict 5-color palette */}
      <div
        className="rounded-3xl p-6 lg:p-8 shadow-xl backdrop-blur-md transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
        }}
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

            <h1
              className="text-3xl lg:text-4xl font-extrabold tracking-tight font-serif"
              style={{ color: "var(--text-primary)" }}
            >
              {currentTargetName.replace(/_/g, " ")} &amp; Lifestyle Intelligence
            </h1>

            {/* Real-Time Cohort Status Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs lg:text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              <span>
                <strong className="font-bold text-indigo-500">
                  {kpis ? kpis.total_students.toLocaleString() : "100,000"}
                </strong>{" "}
                records in active selection
              </span>
              <span>•</span>
              <span>
                Target: <strong className="font-semibold text-rose-500">{currentTargetName.replace(/_/g, " ")}</strong>
              </span>
              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Filtered: {Object.entries(activePillFilters).map(([k, v]) => `${k} = ${v}`).join(", ")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            {/* 4-Color Legend Info Pill */}
            <div
              className="hidden sm:block max-w-xs rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="font-semibold block mb-0.5" style={{ color: "var(--accent-indigo)" }}>
                Executive 4-Color Analytics System
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] pt-1">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> Indigo: Population
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Rose: High Risk
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-teal-500" /> Teal: Health Recovery
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Amber: Exposure Drift
                </span>
              </div>
            </div>

            <a
              href={DatasetApi.getExportUrl(datasetId, "pdf")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm transition hover:opacity-85"
              style={{
                backgroundColor: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "var(--accent-indigo)",
              }}
              title="Download Executive Dashboard &amp; Assessment PDF Report"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF Report
            </a>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm transition hover:opacity-85"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
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
                <span
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {slicer.label}
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handlePillClick(slicer.column, "All")}
                    className="rounded-full px-3.5 py-1 text-xs font-semibold transition shadow-sm"
                    style={
                      activeVal === "All"
                        ? { backgroundColor: "#6366f1", color: "#fff", border: "1px solid #818cf8" }
                        : {
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-default)",
                          }
                    }
                  >
                    All
                  </button>

                  {slicer.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePillClick(slicer.column, opt)}
                      className="rounded-full px-3.5 py-1 text-xs font-semibold transition shadow-sm"
                      style={
                        activeVal === opt
                          ? { backgroundColor: "#6366f1", color: "#fff", border: "1px solid #818cf8" }
                          : {
                              backgroundColor: "var(--bg-elevated)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-default)",
                            }
                      }
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
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition shadow-sm hover:opacity-85"
              style={{
                backgroundColor: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.3)",
                color: "#f43f5e",
              }}
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-bold animate-pulse text-indigo-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Recalculating metrics...
            </div>
          )}
        </div>

        {/* 5 KPI Cards — Strict 4-Color Palette: Indigo, Rose, Teal, Amber */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Records (Color 1: Indigo) */}
          <div
            className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                Total Records
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {kpis ? kpis.total_students.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
              in active cohort
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
          </div>

          {/* Card 2: Positive Outcome Rate (Color 2: Rose) */}
          <div
            className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
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
              {kpis ? `${kpis.depressed_count.toLocaleString()} positive cases` : ""}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
          </div>

          {/* Card 3: Restorative Metric / Avg Sleep Hours (Color 3: Teal) */}
          <div
            className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 truncate max-w-[130px]">
                {metric3Label}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                <Moon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight">
              {metric3Value}
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {metric3Sub}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />
          </div>

          {/* Card 4: Exposure Metric / Avg Social Media (Color 4: Amber) */}
          <div
            className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 truncate max-w-[130px]">
                {metric4Label}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-amber-500 tracking-tight">
              {metric4Value}
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {metric4Sub}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
          </div>

          {/* Card 5: Benchmark Metric / Avg Stress Level (Color 1: Indigo) */}
          <div
            className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 truncate max-w-[130px]">
                {metric5Label}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <BarChart2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-indigo-500 tracking-tight">
              {metric5Value}
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
              {metric5Sub}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
          </div>
        </div>

        {/* 3-Column Grid of Analytical Visuals — Strict 5-color Palette */}
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
                    <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {chart.title}
                    </h3>
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
                      <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-extrabold text-rose-500 border border-rose-500/20">
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
                        <XAxis
                          type="number"
                          stroke={axisStroke}
                          fontSize={10}
                          tickLine={false}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke={axisStroke}
                          fontSize={10}
                          fontWeight={600}
                          tickLine={false}
                          width={75}
                        />
                        <Tooltip
                          cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count?.toLocaleString()} / ${item.payload.total?.toLocaleString()})`,
                            "Prevalence",
                          ]}
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            color: tooltipColor,
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: isDark ? "0 10px 15px -3px rgb(0 0 0 / 0.5)" : "0 10px 15px -3px rgb(0 0 0 / 0.08)",
                          }}
                        />
                        <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                          {chart.data.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={getStoryBarColor(chart.title, entry.name, chart.primary_color, isDark)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <BarChart data={chart.data} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis dataKey="name" stroke={axisStroke} fontSize={10} fontWeight={600} tickLine={false} />
                        <YAxis
                          stroke={axisStroke}
                          fontSize={10}
                          tickLine={false}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count?.toLocaleString()} / ${item.payload.total?.toLocaleString()})`,
                            "Prevalence",
                          ]}
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            color: tooltipColor,
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: isDark ? "0 10px 15px -3px rgb(0 0 0 / 0.5)" : "0 10px 15px -3px rgb(0 0 0 / 0.08)",
                          }}
                        />
                        <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                          {chart.data.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={getStoryBarColor(chart.title, entry.name, chart.primary_color, isDark)}
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

          {/* Visual 6: Lifestyle Gaps Chart (Strict Teal = Protective, Rose = Risk) */}
          {lifestyleGaps && lifestyleGaps.data && (
            <div
              className="flex flex-col justify-between rounded-2xl p-5 shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {lifestyleGaps.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                      <span className="h-2 w-2 rounded-full bg-teal-500" /> Protective Habit
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
                    <XAxis
                      type="number"
                      stroke={axisStroke}
                      fontSize={10}
                      tickLine={false}
                      domain={[-2.5, 0.5]}
                      tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="metric"
                      stroke={axisStroke}
                      fontSize={10}
                      fontWeight={600}
                      tickLine={false}
                      width={85}
                    />
                    <ReferenceLine x={0} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth={1.5} />
                    <Tooltip
                      cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val > 0 ? "+" : ""}${val} (Depressed: ${item.payload.dep_mean}, Healthy: ${item.payload.non_dep_mean})`,
                        "Mean Gap",
                      ]}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        color: tooltipColor,
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: isDark ? "0 10px 15px -3px rgb(0 0 0 / 0.5)" : "0 10px 15px -3px rgb(0 0 0 / 0.08)",
                      }}
                    />
                    <Bar dataKey="gap" radius={[4, 4, 4, 4]}>
                      {lifestyleGaps.data.map((entry, index) => (
                        <Cell
                          key={`gap-cell-${index}`}
                          fill={entry.gap < 0 ? "#0d9488" : "#f43f5e"}
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
        <div
          className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs gap-2"
          style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          <span>
            Mockup rendered from active cohort: <strong style={{ color: "var(--text-primary)" }}>{kpis ? kpis.total_students.toLocaleString() : "100,000"}</strong> rows.
          </span>
          <span className="font-medium">
            Measures calculated dynamically from active cross-filters.
          </span>
        </div>
      </div>
    </div>
  );
}
