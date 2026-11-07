"use client";

import React, { useState } from "react";
import { Filter, X, Plus, RotateCcw } from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { FilterCondition } from "@/types";

export function GlobalFilterBar() {
  const { metadata, activeFilters, addFilter, removeFilter, clearFilters } = useDataset();
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [operator, setOperator] = useState<string>("eq");
  const [filterValue, setFilterValue] = useState<string>("");
  const [filterValue2, setFilterValue2] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!metadata) return null;

  const currentColumnMeta = metadata.columns.find((c) => c.name === selectedColumn);
  const isNumerical = currentColumnMeta?.inferred_type === "numerical";

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumn || filterValue === "") return;

    const condition: FilterCondition = {
      column: selectedColumn,
      operator: operator as any,
      value: isNumerical ? Number(filterValue) : filterValue,
      value2: operator === "between" && filterValue2 !== "" ? Number(filterValue2) : undefined,
    };

    addFilter(condition);
    setFilterValue("");
    setFilterValue2("");
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-white">Global Filters</span>
          {activeFilters.length > 0 && (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
              {activeFilters.length} Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <RotateCcw className="h-3 w-3 text-amber-400" /> Reset Filters
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-500 transition shadow"
          >
            <Plus className="h-3 w-3" /> {isExpanded ? "Hide Controls" : "Add Filter"}
          </button>
        </div>
      </div>

      {/* Filter Form Bar */}
      {isExpanded && (
        <form onSubmit={handleApplyFilter} className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          {/* Column selector */}
          <select
            value={selectedColumn}
            onChange={(e) => {
              setSelectedColumn(e.target.value);
              const col = metadata.columns.find((c) => c.name === e.target.value);
              setOperator(col?.inferred_type === "numerical" ? "gt" : "eq");
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="">Select Column...</option>
            {metadata.columns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.inferred_type})
              </option>
            ))}
          </select>

          {/* Operator */}
          {selectedColumn && (
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none font-mono"
            >
              {isNumerical ? (
                <>
                  <option value="eq">= (Equals)</option>
                  <option value="gt">&gt; (Greater Than)</option>
                  <option value="gte">&gt;= (Greater Than or Equal)</option>
                  <option value="lt">&lt; (Less Than)</option>
                  <option value="lte">&lt;= (Less Than or Equal)</option>
                  <option value="between">Between Range</option>
                  <option value="neq">!= (Not Equal)</option>
                </>
              ) : (
                <>
                  <option value="eq">= (Equals)</option>
                  <option value="contains">Contains Substring</option>
                  <option value="neq">!= (Not Equal)</option>
                </>
              )}
            </select>
          )}

          {/* Value Inputs */}
          {selectedColumn && (
            <>
              <input
                type={isNumerical ? "number" : "text"}
                step="any"
                placeholder={operator === "between" ? "Min value" : "Filter value..."}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
              />

              {operator === "between" && (
                <input
                  type="number"
                  step="any"
                  placeholder="Max value"
                  value={filterValue2}
                  onChange={(e) => setFilterValue2(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              )}

              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-500 transition"
              >
                Apply
              </button>
            </>
          )}
        </form>
      )}

      {/* Active Filter Badges */}
      {activeFilters.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/40">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active:</span>
          {activeFilters.map((f) => (
            <span
              key={f.column}
              className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-300 font-mono"
            >
              <span>{f.column}</span>
              <span className="text-slate-400">{f.operator}</span>
              <span className="font-bold text-white">
                {f.operator === "between" ? `[${f.value}, ${f.value2}]` : String(f.value)}
              </span>
              <button
                onClick={() => removeFilter(f.column)}
                className="ml-1 rounded p-0.5 text-slate-400 hover:bg-sky-500/20 hover:text-white"
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
