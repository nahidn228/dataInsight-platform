"use client";

import React, { useEffect, useState } from "react";
import { DatasetApi } from "@/lib/api";
import { DynamicAnalysisConfig, DepressionAnalysisResponse } from "@/types";
import { useDataset } from "@/context/DatasetContext";
import { Loader2, CheckCircle, SlidersHorizontal, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

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
        /depression|depressed|churn|target|condition/i.test(c)
      );
      if (detectedTarget) setTargetColumn(detectedTarget);
      else if (metadata.categorical_columns.length > 0) {
        setTargetColumn(metadata.categorical_columns[0]);
      }
    }

    if (currentConfig?.filter_columns && currentConfig.filter_columns.length > 0) {
      setFilterColumns(currentConfig.filter_columns);
    } else {
      // Auto-detect filter columns (Gender, Department, Age)
      const defaultFilters = colNames.filter((c) =>
        /gender|sex|dept|department|faculty|age/i.test(c)
      );
      setFilterColumns(defaultFilters.length > 0 ? defaultFilters : colNames.slice(1, 4));
    }

    if (currentConfig?.analysis_columns && currentConfig.analysis_columns.length > 0) {
      setAnalysisColumns(currentConfig.analysis_columns);
    } else {
      // Auto-detect analysis columns (Stress, CGPA, Sleep, Social Media, Department)
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
          // Auto-select positive value (e.g. True, 1, Yes, Depressed)
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

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Dynamic Analysis & Slicer Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any target result column, positive value, filter slicers, and factor analysis columns.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isOpen ? (
            <>
              Hide Config <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Customize Columns <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 space-y-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
          {/* Target Column & Positive Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Target / Outcome Column
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Positive Result Value
              </label>
              {loadingVals ? (
                <div className="flex h-9 items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading distinct values...
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                  {availablePosVals.map((val) => {
                    const isSelected = positiveValues.includes(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPositiveValues([val])}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          isSelected
                            ? "bg-[#343075] text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Dashboard Filter Slicers (appears as horizontal pills)
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {metadata.columns
                .filter((c) => c.name !== targetColumn)
                .map((col) => {
                  const isChecked = filterColumns.includes(col.name);
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => toggleFilterCol(col.name)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        isChecked
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Analysis Columns (generates rate charts against target)
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {metadata.columns
                .filter((c) => c.name !== targetColumn)
                .map((col) => {
                  const isChecked = analysisColumns.includes(col.name);
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => toggleAnalysisCol(col.name)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        isChecked
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {col.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || !targetColumn}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#343075] to-[#4a47a3] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Apply Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
