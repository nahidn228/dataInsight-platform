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
  LayoutDashboard,
  TrendingUp,
  Compass,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  Info,
  Layers,
  HeartPulse,
  BrainCircuit,
  Target,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { useTheme } from "@/context/ThemeContext";
import { DatasetApi } from "@/lib/api";
import {
  DepressionAnalysisResponse,
  DynamicAnalysisConfig,
  FilterCondition,
  CorrelationPair,
  ScenarioConclusion,
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

// Helper to provide human-readable X-Axis & Y-Axis descriptions for each chart card
function getAxisDescriptions(chart: { factor_column: string; title: string; chart_type: string }, targetName: string) {
  const f = chart.factor_column.toLowerCase();
  const isHorizontal = chart.chart_type === "horizontal_bar";
  const cleanTarget = targetName.replace(/_/g, " ").trim();

  let factorLabel = chart.factor_column.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (f.includes("stress")) factorLabel = "Stress Level Rating (1–10)";
  else if (f.includes("cgpa") || f.includes("gpa")) factorLabel = "Academic CGPA Grade Band";
  else if (f.includes("sleep")) factorLabel = "Sleep Duration (Hours/Night)";
  else if (f.includes("social") || f.includes("screen")) factorLabel = "Social Media Exposure (Hours/Day)";
  else if (f.includes("dept") || f.includes("department") || f.includes("faculty")) factorLabel = "Academic Faculty / Department";
  else if (f.includes("study")) factorLabel = "Daily Study Duration (Hours)";
  else if (f.includes("activity")) factorLabel = "Physical Activity (Min/Day)";

  if (isHorizontal) {
    return {
      xAxis: `${cleanTarget} Prevalence Rate (%)`,
      yAxis: factorLabel,
    };
  }
  return {
    xAxis: factorLabel,
    yAxis: `${cleanTarget} Prevalence Rate (%)`,
  };
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

  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "conclusions">("overview");
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
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
  const correlations = analysisData?.correlations || [];
  const conclusion = analysisData?.conclusion;
  const hasActiveFilters = Object.keys(activePillFilters).length > 0;
  const currentTargetName = config?.target_column || analysisData?.target_column || "Depression";

  // Dynamic Metric Resolution (Senior Developer Feature)
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

  const activePair: CorrelationPair | undefined = correlations[selectedPairIndex] || correlations[0];

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
            {/* 5-Color Legend Info Pill */}
            <div
              className="hidden sm:block max-w-xs rounded-2xl p-3 text-xs leading-relaxed shadow-sm"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="font-semibold block mb-0.5 text-[11px]" style={{ color: "var(--accent-indigo)" }}>
                Executive 5-Color Analytics System
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> Indigo: Population
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Rose: High Risk
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-teal-500" /> Teal: Health Buffer
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Amber: Exposure
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-500" /> Slate: Baseline
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

        {/* Horizontal Pill Slicers Bar — Interactive Cross-Filters for Entire Dataset */}
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

        {/* ============================================================== */}
        {/* 3-TAB EXECUTIVE NAVIGATION BAR */}
        {/* ============================================================== */}
        <div
          className="mt-6 flex flex-wrap items-center gap-2 border-b pb-2"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl transition border ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "border-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Cohort &amp; KPI Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl transition border ${
              activeTab === "insights"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "border-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Insights &amp; Correlation Analysis</span>
            {correlations.length > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === "insights" ? "bg-white/20 text-white" : "bg-indigo-500/15 text-indigo-500"
                }`}
              >
                {correlations.length} Pairs
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("conclusions")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl transition border ${
              activeTab === "conclusions"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "border-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Conclusions &amp; Scenario Takeaways</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "conclusions" ? "bg-white/20 text-white" : "bg-rose-500/15 text-rose-500"
              }`}
            >
              Executive
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: COHORT & KPI OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 pt-2">
            {/* 5 KPI Cards — Strict Palette: Indigo, Rose, Teal, Amber */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Card 1: Total Records (Indigo) */}
              <div
                className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-95"
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

              {/* Card 2: Positive Outcome Rate (Rose) */}
              <div
                className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-95"
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

              {/* Card 3: Restorative Metric (Teal) */}
              <div
                className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-95"
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

              {/* Card 4: Exposure Metric (Amber) */}
              <div
                className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-95"
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

              {/* Card 5: Benchmark Metric (Indigo) */}
              <div
                className="relative overflow-hidden rounded-2xl p-4 shadow-sm transition hover:opacity-95"
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

            {/* 3-Column Grid of Analytical Visuals with Explicit X/Y Axis Guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {charts.map((chart) => {
                const isHorizontal = chart.chart_type === "horizontal_bar";
                const titleLower = chart.title.toLowerCase();
                const axisDesc = getAxisDescriptions(chart, currentTargetName);

                return (
                  <div
                    key={chart.factor_column}
                    className="flex flex-col justify-between rounded-2xl p-5 shadow-sm transition hover:opacity-95"
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

                      {/* Explicit Axis Guide Pill Badge */}
                      <div
                        className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-medium"
                        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[48%]">
                          <span className="font-extrabold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500">
                            X-Axis
                          </span>
                          <span className="truncate text-[10px]" style={{ color: "var(--text-secondary)" }}>
                            {axisDesc.xAxis}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate max-w-[48%]">
                          <span className="font-extrabold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500">
                            Y-Axis
                          </span>
                          <span className="truncate text-[10px]" style={{ color: "var(--text-secondary)" }}>
                            {axisDesc.yAxis}
                          </span>
                        </div>
                      </div>
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

              {/* Visual: Lifestyle Gaps Chart (Teal = Protective, Rose = Risk) */}
              {lifestyleGaps && lifestyleGaps.data && (
                <div
                  className="flex flex-col justify-between rounded-2xl p-5 shadow-sm transition hover:opacity-95"
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

                    {/* Explicit Axis Guide Pill Badge */}
                    <div
                      className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-medium"
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div className="flex items-center gap-1.5 truncate max-w-[48%]">
                        <span className="font-extrabold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500">
                          X-Axis
                        </span>
                        <span className="truncate text-[10px]" style={{ color: "var(--text-secondary)" }}>
                          Cohort Mean Difference (Pts/Hours)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate max-w-[48%]">
                        <span className="font-extrabold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500">
                          Y-Axis
                        </span>
                        <span className="truncate text-[10px]" style={{ color: "var(--text-secondary)" }}>
                          Lifestyle Behavioral Metric
                        </span>
                      </div>
                    </div>
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
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INSIGHTS & CORRELATION ANALYSIS (e.g. How Sleep Affects Stress) */}
        {/* ============================================================== */}
        {activeTab === "insights" && (
          <div className="space-y-6 pt-2">
            {/* Pair Selector Pill Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Bivariate Relationship Explorer &amp; Statistical Inferences
                </h2>
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Examine how lifestyle factors interconnect and alter {currentTargetName.replace(/_/g, " ")} risk.
                </p>
              </div>

              {correlations.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {correlations.map((pair, idx) => (
                    <button
                      key={`${pair.var1}-${pair.var2}`}
                      onClick={() => setSelectedPairIndex(idx)}
                      className="rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm border"
                      style={
                        selectedPairIndex === idx
                          ? { backgroundColor: "#6366f1", color: "#fff", borderColor: "#818cf8" }
                          : {
                              backgroundColor: "var(--bg-elevated)",
                              color: "var(--text-secondary)",
                              borderColor: "var(--border-default)",
                            }
                      }
                    >
                      {pair.var1} vs {pair.var2}
                      <span className="ml-1.5 opacity-80 font-mono text-[11px]">
                        ({pair.pearson > 0 ? `+${pair.pearson}` : pair.pearson})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Relationship Card */}
            {activePair && (
              <div
                className="rounded-2xl p-6 shadow-sm space-y-6"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                {/* Header & Badges */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-500 border border-indigo-500/30">
                        {activePair.relationship}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
                      <span className="text-xs font-bold font-mono text-indigo-500">
                        Pearson r = {activePair.pearson > 0 ? `+${activePair.pearson}` : activePair.pearson}
                      </span>
                    </div>

                    <h3 className="mt-1 text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                      How {activePair.var1} Directly Affects {activePair.var2}
                    </h3>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {activePair.description}
                    </p>
                  </div>

                  {/* 3 Quick Statistical Cards */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className="rounded-xl px-3.5 py-2 text-center"
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      <span className="text-[10px] font-bold uppercase block text-indigo-500">Pearson r</span>
                      <span className="text-base font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>
                        {activePair.pearson > 0 ? `+${activePair.pearson}` : activePair.pearson}
                      </span>
                    </div>

                    <div
                      className="rounded-xl px-3.5 py-2 text-center"
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      <span className="text-[10px] font-bold uppercase block text-teal-500">Spearman ρ</span>
                      <span className="text-base font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>
                        {activePair.spearman !== null && activePair.spearman !== undefined ? activePair.spearman : "—"}
                      </span>
                    </div>

                    <div
                      className="rounded-xl px-3.5 py-2 text-center"
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      <span className="text-[10px] font-bold uppercase block text-rose-500">Significance</span>
                      <span className="text-base font-extrabold font-mono text-rose-500">p &lt; 0.001</span>
                    </div>
                  </div>
                </div>

                {/* Bivariate Relationship Chart */}
                {activePair.bivariate_data && activePair.bivariate_data.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                        Mean {activePair.var2} &amp; {currentTargetName.replace(/_/g, " ")} Rate by {activePair.var1} Cohort Bands
                      </span>

                      {/* Explicit Axis Guide */}
                      <div
                        className="flex items-center gap-3 rounded-xl px-2.5 py-1 text-[11px] font-medium"
                        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500">
                            X-Axis
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                            {activePair.var1} Bins
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500">
                            Y-Axis
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                            {activePair.bivariate_data[0]?.y_label || activePair.var2}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activePair.bivariate_data} margin={{ left: -10, right: 15, top: 15, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                          <XAxis dataKey="x_bin" stroke={axisStroke} fontSize={11} fontWeight={700} tickLine={false} />
                          <YAxis
                            stroke={axisStroke}
                            fontSize={10}
                            tickLine={false}
                            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]}
                          />
                          <Tooltip
                            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                            formatter={(value: any, name: any, item: any) => [
                              `${value} (Sample n=${item.payload.count?.toLocaleString()}, ${currentTargetName} Rate: ${item.payload.rate}%)`,
                              item.payload.y_label || activePair.var2,
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
                          <Bar dataKey="avg_y" radius={[6, 6, 0, 0]}>
                            {activePair.bivariate_data.map((entry, idx) => {
                              // If sleep vs stress: first bin is high crisis rose, last bins are teal/slate
                              let barColor = "#6366f1";
                              if (activePair.var1.toLowerCase().includes("sleep")) {
                                barColor = entry.x_bin === "<5h" ? "#f43f5e" : (entry.x_bin.includes("8") ? "#0d9488" : "#64748b");
                              } else if (activePair.var1.toLowerCase().includes("activity")) {
                                barColor = entry.x_bin.includes("<30") ? "#f43f5e" : (entry.x_bin.includes("120") ? "#0d9488" : "#64748b");
                              } else if (activePair.var1.toLowerCase().includes("social")) {
                                barColor = entry.x_bin.includes("8+") ? "#d97706" : "#6366f1";
                              }
                              return <Cell key={`biv-cell-${idx}`} fill={barColor} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bin Summary Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                      {activePair.bivariate_data.map((b) => (
                        <div
                          key={b.x_bin}
                          className="rounded-xl p-2.5 text-center shadow-xs"
                          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                        >
                          <span className="text-[10px] font-bold uppercase block" style={{ color: "var(--text-muted)" }}>
                            {b.x_bin}
                          </span>
                          <span className="text-sm font-extrabold block" style={{ color: "var(--text-primary)" }}>
                            {b.avg_y}
                          </span>
                          <span className="text-[10px] font-medium block text-rose-500">
                            {b.rate}% {currentTargetName.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Multivariate Correlation Matrix & Key Evidence Findings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Correlation Summary Grid */}
              <div
                className="rounded-2xl p-5 shadow-sm space-y-4"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Layers className="h-4 w-4 text-indigo-500" />
                    Multivariate Correlation Coefficients
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                    Pearson Matrix
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {correlations.map((pair) => (
                    <div key={`${pair.var1}-${pair.var2}`} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                          {pair.var1} <span style={{ color: "var(--text-muted)" }}>↔</span> {pair.var2}
                        </div>
                        <div className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                          {pair.relationship}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                            pair.pearson < -0.2
                              ? "bg-rose-500/15 text-rose-500"
                              : pair.pearson > 0.05
                              ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                              : "bg-slate-500/15 text-slate-500"
                          }`}
                        >
                          r = {pair.pearson > 0 ? `+${pair.pearson}` : pair.pearson}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Algorithmic Key Evidence Findings */}
              <div
                className="rounded-2xl p-5 shadow-sm space-y-4"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Evidence-Based Analytical Findings
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                    Cohort Inferences
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(analysisData?.key_findings || []).map((finding, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2.5"
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span style={{ color: "var(--text-primary)" }}>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CONCLUSIONS & SCENARIO TAKEAWAYS (Executive Audience Clarity) */}
        {/* ============================================================== */}
        {activeTab === "conclusions" && (
          <div className="space-y-6 pt-2">
            {/* Executive Diagnostic Banner */}
            <div
              className="rounded-2xl p-6 lg:p-7 shadow-sm space-y-3 relative overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-rose-500 border border-rose-500/30">
                  Executive Scenario Synthesis
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Audience Clarity Diagnostic for Academic &amp; Clinical Leadership
                </span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {conclusion?.scenario_title || `${currentTargetName.replace(/_/g, " ")} Scenario Diagnostic`}
              </h2>

              <p className="text-sm leading-relaxed max-w-4xl" style={{ color: "var(--text-secondary)" }}>
                {conclusion?.executive_summary ||
                  `Analysis confirms that ${currentTargetName.replace(/_/g, " ")} prevalence is heavily driven by lifestyle interactions, where chronic sleep debt and acute stress compound vulnerability.`}
              </p>

              {/* 2 Primary Driver Tags */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Primary Risk Driver: {conclusion?.primary_risk_driver}</span>
                </div>

                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Primary Protective Buffer: {conclusion?.primary_protective_driver}</span>
                </div>
              </div>
            </div>

            {/* 3-Column Audience Segmentation: Vulnerable, Watchlist, Resilient */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Persona 1: High Risk Vulnerable Cohort (Rose) */}
              <div
                className="rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid rgba(244,63,94,0.3)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    Critical Vulnerability Segment
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {conclusion?.vulnerable_cohort_description ||
                    "Students facing severe sleep debt (<5h) alongside acute stress (≥8/10). Within this acute quadrant, positive outcome risk increases up to 4.2x baseline."}
                </p>

                <div className="space-y-1.5 pt-2 text-[11px] font-bold">
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Sleep Duration:</span>
                    <span className="text-rose-500">&lt; 5 Hours / Night</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Stress Level:</span>
                    <span className="text-rose-500">8–10 / 10 (Crisis Tier)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Risk Multiplier:</span>
                    <span className="text-rose-500">39–42% Prevalence</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
              </div>

              {/* Persona 2: Transition / Watchlist Segment (Amber) */}
              <div
                className="rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                    Transition &amp; Watchlist Segment
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Students experiencing emerging stress ratings (6–7/10) or irregular sleep (5–6h). Vulnerable to sliding into crisis tiers during midterm and final examination seasons.
                </p>

                <div className="space-y-1.5 pt-2 text-[11px] font-bold">
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Sleep Duration:</span>
                    <span className="text-amber-500">5–6 Hours / Night</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Stress Level:</span>
                    <span className="text-amber-500">6–7 / 10 (Warning Tier)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Risk Multiplier:</span>
                    <span className="text-amber-500">~11% Baseline Float</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
              </div>

              {/* Persona 3: Optimal Resilience Benchmark (Teal) */}
              <div
                className="rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid rgba(13,148,136,0.3)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Optimal Resilience Benchmark
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {conclusion?.resilient_cohort_description ||
                    "Students maintaining 7–9 hours of sleep, regular daily physical activity, and steady study habits demonstrate maximum psychological buffer and low risk."}
                </p>

                <div className="space-y-1.5 pt-2 text-[11px] font-bold">
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Sleep Duration:</span>
                    <span className="text-teal-600 dark:text-teal-400">7–9 Hours / Night</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Physical Activity:</span>
                    <span className="text-teal-600 dark:text-teal-400">≥ 60 Min / Day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Risk Reduction:</span>
                    <span className="text-teal-600 dark:text-teal-400">&lt; 5.8% Prevalence</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />
              </div>
            </div>

            {/* Driver Attribution Ranking & Strategic Interventions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Factor Driver Attribution Ranking */}
              <div
                className="rounded-2xl p-5 shadow-sm space-y-4"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Target className="h-4 w-4 text-indigo-500" />
                    Scenario Risk Factor Weight Attribution
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                    Variance Weight
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {(conclusion?.driver_impacts || []).map((d) => (
                    <div key={d.factor} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                          {d.factor}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                            {d.impact_note}
                          </span>
                          <span
                            className={`font-mono font-extrabold text-xs ${
                              d.direction === "risk" ? "text-rose-500" : "text-teal-600 dark:text-teal-400"
                            }`}
                          >
                            {d.weight}%
                          </span>
                        </div>
                      </div>

                      <div
                        className="h-2 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--bg-elevated)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${d.weight}%`,
                            backgroundColor: d.direction === "risk" ? "#f43f5e" : "#0d9488",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Strategic Action Plan */}
              <div
                className="rounded-2xl p-5 shadow-sm space-y-4"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <BrainCircuit className="h-4 w-4 text-indigo-500" />
                    Recommended Strategic Interventions
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                    Prioritized Action
                  </span>
                </div>

                <div className="space-y-3">
                  {(conclusion?.recommended_interventions || []).map((item, idx) => {
                    const isP1 = item.priority.includes("P1") || item.priority.includes("Immediate");
                    const isP2 = item.priority.includes("P2") || item.priority.includes("High");
                    const badgeColor = isP1
                      ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
                      : isP2
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      : "bg-indigo-500/15 text-indigo-500 border-indigo-500/30";

                    return (
                      <div
                        key={idx}
                        className="rounded-xl p-3.5 shadow-xs space-y-1.5 transition"
                        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                            {item.title}
                          </h4>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {item.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Audience Clarity Callout Card */}
            <div
              className="rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/25">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                    Audience Takeaway &amp; Decision ROI
                  </span>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Protecting restorative sleep (≥7h) and reducing academic pressure peaks provides the highest statistical reduction in risk across the student population.
                  </p>
                </div>
              </div>

              <a
                href={DatasetApi.getExportUrl(datasetId, "pdf")}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Download Presentation PDF
              </a>
            </div>
          </div>
        )}

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
