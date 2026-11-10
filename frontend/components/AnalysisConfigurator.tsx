"use client";

import React, { useEffect, useState } from "react";
import { DatasetApi } from "@/lib/api";
import { DynamicAnalysisConfig, DepressionAnalysisResponse } from "@/types";
import { useDataset } from "@/context/DatasetContext";
import { Loader2, CheckCircle, SlidersHorizontal, ChevronDown, ChevronUp, Search } from "lucide-react";

interface Props {
  onApply: (response: DepressionAnalysisResponse, config: DynamicAnalysisConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentConfig?: DynamicAnalysisConfig;
}

export default function AnalysisConfigurator({ onApply, isOpen, onToggle, currentConfig }: Props) {
  const { metadata, datasetId } = useDataset();
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [positiveValues, setPositiveValues] = useState<string[]>([]);
  const [availablePosVals, setAvailablePosVals] = useState<string[]>([]);
  const [filterColumns, setFilterColumns] = useState<string[]>([]);
  const [analysisColumns, setAnalysisColumns] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [analysisSearch, setAnalysisSearch] = useState<string>("");
  const [loadingVals, setLoadingVals] = useState(false);
  const [applying, setApplying] = useState(false);

  // Initialize sensible defaults based on metadata or currentConfig
  useEffect(() => {
    if (!metadata) return;

    const colNames = metadata.columns.map((c) => c.name);

    if (currentConfig?.target_column) {
      setTargetColumn(currentConfig.target_column);
    } else {
      // Auto-detect target column
      const detectedTarget = colNames.find((c) =>
        /depression|depressed|churn|target|condition|attrition/i.test(c)
      );
      if (detectedTarget) setTargetColumn(detectedTarget);
      else if (metadata.categorical_columns.length > 0) {
        setTargetColumn(metadata.categorical_columns[0]);
      } else if (colNames.length > 0) {
        setTargetColumn(colNames[colNames.length - 1]);
      }
    }

    if (currentConfig?.filter_columns && currentConfig.filter_columns.length > 0) {
      setFilterColumns(currentConfig.filter_columns);
    } else {
      const defaultFilters = colNames.filter((c) =>
        /gender|sex|dept|department|faculty|age/i.test(c)
      );
      setFilterColumns(defaultFilters.length > 0 ? defaultFilters : colNames.slice(1, 4));
    }

    if (currentConfig?.analysis_columns && currentConfig.analysis_columns.length > 0) {
      setAnalysisColumns(currentConfig.analysis_columns);
    } else {
      const defaultAnalysis = colNames.filter((c) =>
        /stress|cgpa|gpa|sleep|social|media|screen|dept|study|diet|pressure/i.test(c)
      );
      setAnalysisColumns(
        defaultAnalysis.length > 0 ? defaultAnalysis : colNames.filter((c) => c !== targetColumn).slice(0, 5)
      );
    }
  }, [metadata, currentConfig]);

  // Load distinct values when target column changes
  useEffect(() => {
    if (!targetColumn || !datasetId) return;
    setLoadingVals(true);
    DatasetApi.getColumnValues(datasetId, targetColumn)
      .then((vals) => {
        setAvailablePosVals(vals);
        if (currentConfig?.positive_values && currentConfig.positive_values.length > 0) {
          setPositiveValues(currentConfig.positive_values.map(String));
        } else {
          const autoPos = vals.find((v) => /true|1|yes|depressed|positive/i.test(v));
          if (autoPos) setPositiveValues([autoPos]);
          else if (vals.length > 0) setPositiveValues([vals[0]]);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingVals(false));
  }, [targetColumn, datasetId]);

  const toggleFilterCol = (colName: string) => {
    setFilterColumns((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  const toggleAnalysisCol = (colName: string) => {
    setAnalysisColumns((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  const handleApply = async () => {
    if (!datasetId || !targetColumn) return;
    setApplying(true);
    const cfg: DynamicAnalysisConfig = {
      target_column: targetColumn,
      positive_values: positiveValues,
      filter_columns: filterColumns,
      analysis_columns: analysisColumns,
      filters: [],
    };
    try {
      const resp = await DatasetApi.startDynamicAnalysis(datasetId, cfg);
      onApply(resp, cfg);
    } catch (e) {
      console.error(e);
      alert("Failed to compute dynamic analysis.");
    } finally {
      setApplying(false);
    }
  };

  if (!metadata) return null;

  const filteredForFilters = metadata.columns.filter(
    (c) => c.name !== targetColumn && c.name.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const filteredForAnalysis = metadata.columns.filter(
    (c) => c.name !== targetColumn && c.name.toLowerCase().includes(analysisSearch.toLowerCase())
  );

  /* Shared pill style helpers */
  const activePill: React.CSSProperties = { backgroundColor: "#6366f1", color: "#fff", border: "1px solid #818cf8" };
  const activePurplePill: React.CSSProperties = { backgroundColor: "#9333ea", color: "#fff", border: "1px solid #a855f7" };
  const inactivePill: React.CSSProperties = {
    backgroundColor: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-default)",
  };
  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-base)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
  };
  const containerStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-base)",
    border: "1px solid var(--border-subtle)",
  };

  return (
    <div
      className="mb-6 rounded-2xl p-5 shadow-lg transition-all"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
    >
      <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              Dynamic Column Selection & Analytics Configurator
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-500">
                Any Column
              </span>
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Choose your Target/Result column, positive state, top filter slicers, and factor analysis columns.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-80"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        >
          {isOpen ? (
            <>Hide Config <ChevronUp className="h-3.5 w-3.5" /></>
          ) : (
            <>Customize Columns <ChevronDown className="h-3.5 w-3.5" /></>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 space-y-6 pt-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {/* Target Column & Positive Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                1. Target / Result Column (What you are predicting or measuring)
              </label>
              <select
                className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={inputStyle}
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
              >
                {metadata.columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.inferred_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                2. Positive Outcome Value (e.g. Yes, True, 1, Depressed)
              </label>
              {loadingVals ? (
                <div className="flex h-10 items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading distinct values...
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {availablePosVals.map((val) => {
                    const isSelected = positiveValues.includes(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPositiveValues([val])}
                        className="rounded-full px-3 py-1 text-xs font-medium transition"
                        style={isSelected ? activePill : inactivePill}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Slicer Filter Columns */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                3. Slicer Filter Columns (Appear as interactive horizontal pills)
              </label>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full rounded-lg py-1 pl-8 pr-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto p-1 rounded-xl" style={containerStyle}>
              {filteredForFilters.map((col) => {
                const isChecked = filterColumns.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleFilterCol(col.name)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition"
                    style={isChecked ? activePill : inactivePill}
                  >
                    {isChecked ? "✓ " : "+ "}
                    {col.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Factor Analysis Columns */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                4. Analysis Columns (Generates analytical rate charts against the outcome)
              </label>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={analysisSearch}
                  onChange={(e) => setAnalysisSearch(e.target.value)}
                  className="w-full rounded-lg py-1 pl-8 pr-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto p-1 rounded-xl" style={containerStyle}>
              {filteredForAnalysis.map((col) => {
                const isChecked = analysisColumns.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleAnalysisCol(col.name)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition"
                    style={isChecked ? activePurplePill : inactivePill}
                  >
                    {isChecked ? "✓ " : "+ "}
                    {col.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Active: Target: <strong className="text-indigo-500">{targetColumn}</strong> ({positiveValues.join(", ") || "auto"}) • Filters: <strong style={{ color: "var(--text-primary)" }}>{filterColumns.length}</strong> • Charts: <strong style={{ color: "var(--text-primary)" }}>{analysisColumns.length}</strong>
            </span>

            <button
              type="button"
              onClick={handleApply}
              disabled={applying || !targetColumn}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 transition"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Apply Dynamic Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
