"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  RotateCcw,
  RefreshCw,
  Info,
  SlidersHorizontal,
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

  return (
    <div className="space-y-6">
      {/* Dynamic Column Configurator Toggleable Component */}
      <AnalysisConfigurator
        isOpen={showConfig}
        onToggle={() => setShowConfig(!showConfig)}
        onApply={handleConfigApply}
        currentConfig={config}
      />

      {/* Main Power BI Canvas Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-[#f4f5f8] p-6 lg:p-8 text-slate-800 shadow-sm transition-all">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 border-b border-slate-200/90 pb-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Power BI Draft • Page 1 of 1
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1f214d] font-serif">
              Student Lifestyle & Mental Health
            </h1>
            <p className="text-xs lg:text-sm text-slate-600 font-medium pt-0.5">
              {kpis ? kpis.total_students.toLocaleString() : "100,000"} students · ages 18–24 · how sleep, social
              media, stress and habits relate to depression
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="max-w-xs rounded-xl border border-[#dedcf2] bg-[#f0effb] p-3 text-xs text-slate-700 leading-relaxed shadow-xs">
              Interactive mockup of the proposed report page. The slicers below filter every visual,
              exactly as they will in Power BI Desktop.
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              title="Customize analysis columns and target"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-700" /> Columns
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
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition shadow-xs ${
                      activeVal === "All"
                        ? "bg-[#343075] text-white font-semibold"
                        : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50"
                    }`}
                  >
                    All
                  </button>

                  {slicer.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePillClick(slicer.column, opt)}
                      className={`rounded-full px-3.5 py-1 text-xs font-medium transition shadow-xs ${
                        activeVal === opt
                          ? "bg-[#343075] text-white font-semibold"
                          : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-xs"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Recalculating...
            </div>
          )}
        </div>

        {/* 5 KPI Summary Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Students */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Students</span>
            <p className="mt-1.5 text-2xl lg:text-3xl font-extrabold text-[#1f214d] tracking-tight">
              {kpis ? kpis.total_students.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">in current selection</p>
          </div>

          {/* Card 2: Depression Rate */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">
              {config?.target_column ? `${config.target_column.replace(/_/g, " ")} rate` : "Depression rate"}
            </span>
            <p className="mt-1.5 text-2xl lg:text-3xl font-extrabold text-[#1f214d] tracking-tight">
              {kpis ? `${kpis.depression_rate}%` : "—"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {kpis ? `${kpis.depressed_count.toLocaleString()} students` : ""}
            </p>
          </div>

          {/* Card 3: Avg Social Media */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Avg social media</span>
            <p className="mt-1.5 text-2xl lg:text-3xl font-extrabold text-[#1f214d] tracking-tight">
              {kpis?.avg_social_media !== null && kpis?.avg_social_media !== undefined
                ? `${kpis.avg_social_media} h/day`
                : "3.5 h/day"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">daily use</p>
          </div>

          {/* Card 4: Avg Sleep */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Avg sleep</span>
            <p className="mt-1.5 text-2xl lg:text-3xl font-extrabold text-[#1f214d] tracking-tight">
              {kpis?.avg_sleep !== null && kpis?.avg_sleep !== undefined
                ? `${kpis.avg_sleep} h/night`
                : "7.0 h/night"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">school-night average</p>
          </div>

          {/* Card 5: Avg Stress */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Avg stress</span>
            <p className="mt-1.5 text-2xl lg:text-3xl font-extrabold text-[#1f214d] tracking-tight">
              {kpis?.avg_stress !== null && kpis?.avg_stress !== undefined
                ? `${kpis.avg_stress} / 10`
                : "4.1 / 10"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">self-reported</p>
          </div>
        </div>

        {/* 3-Column Grid of Analytical Visuals */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {charts.map((chart) => {
            const isHorizontal = chart.chart_type === "horizontal_bar";
            return (
              <div
                key={chart.factor_column}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#1f214d]">{chart.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-snug line-clamp-2">
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
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          width={75}
                        />
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${value}% (${item.payload.count?.toLocaleString()} / ${item.payload.total?.toLocaleString()})`,
                            "Rate",
                          ]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            borderRadius: "10px",
                            fontSize: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar dataKey="rate" fill={chart.primary_color || "#6f7d95"} radius={[0, 3, 3, 0]} />
                      </BarChart>
                    ) : (
                      <BarChart data={chart.data} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                            "Rate",
                          ]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            borderRadius: "10px",
                            fontSize: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar dataKey="rate" fill={chart.primary_color || "#d9534f"} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}

          {/* Visual 6: Depressed vs non-depressed: lifestyle gaps */}
          {lifestyleGaps && lifestyleGaps.data && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#1f214d]">{lifestyleGaps.title}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-snug line-clamp-2">
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
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      width={85}
                    />
                    <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val > 0 ? "+" : ""}${val} (Depressed: ${item.payload.dep_mean}, Healthy: ${item.payload.non_dep_mean})`,
                        "Mean Gap",
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "10px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="gap">
                      {lifestyleGaps.data.map((entry, index) => (
                        <Cell
                          key={`gap-cell-${index}`}
                          fill={entry.gap < 0 ? "#009688" : "#d9534f"}
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
        <div className="mt-8 border-t border-slate-200/80 pt-4 text-center text-xs text-slate-400">
          Mockup rendered from the full {kpis ? kpis.total_students.toLocaleString() : "100,000"}-row dataset.
          In Power BI Desktop: same page built from the StudentLifestyle table with the measures listed in the build guide.
        </div>
      </div>
    </div>
  );
}
