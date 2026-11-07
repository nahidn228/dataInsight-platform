"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { DatasetApi } from "@/lib/api";
import { DatasetPreview } from "@/types";

export default function ExplorerPage() {
  const { metadata, datasetId } = useDataset();
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortAscending, setSortAscending] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColMenu, setShowColMenu] = useState(false);

  useEffect(() => {
    if (metadata && visibleColumns.length === 0) {
      setVisibleColumns(metadata.columns.map((c) => c.name));
    }
  }, [metadata]);

  const loadData = async () => {
    if (!datasetId) return;
    setLoading(true);
    try {
      const data = await DatasetApi.getPreview(
        datasetId,
        page,
        pageSize,
        sortColumn,
        sortAscending,
        searchQuery
      );
      setPreview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [datasetId, page, pageSize, sortColumn, sortAscending]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAscending(!sortAscending);
    } else {
      setSortColumn(column);
      setSortAscending(true);
    }
    setPage(1);
  };

  const toggleColumn = (col: string) => {
    if (visibleColumns.includes(col)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((c) => c !== col));
      }
    } else {
      setVisibleColumns([...visibleColumns, col]);
    }
  };

  if (!metadata || !datasetId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Database className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Dataset Active</h2>
        <p className="max-w-md text-sm text-slate-400">
          Please upload a CSV or Excel dataset to explore tabular data with server-side pagination.
        </p>
        <Link
          href="/upload"
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sky-500 transition-colors"
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
            <Compass className="h-4 w-4" /> Server-side High Performance Data Explorer
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Interactive Tabular Data Grid
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={DatasetApi.getExportUrl(datasetId, "csv")}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" /> Export CSV
          </a>
          <a
            href={DatasetApi.getExportUrl(datasetId, "xlsx")}
            download
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition"
          >
            <Download className="h-3.5 w-3.5 text-white" /> Export Excel
          </a>
        </div>
      </div>

      {/* Control Bar: Search, Columns, Page Size */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search across all records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 relative">
          {/* Column Visibility Menu */}
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            <Eye className="h-3.5 w-3.5" /> Columns ({visibleColumns.length}/{metadata.columns.length})
          </button>

          {showColMenu && (
            <div className="absolute right-0 top-11 z-50 w-56 max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-xl">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Toggle Fields</span>
              <div className="space-y-1.5">
                {metadata.columns.map((col) => (
                  <label key={col.name} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.name)}
                      onChange={() => toggleColumn(col.name)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                    />
                    <span className="truncate">{col.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold tracking-wider uppercase">
              <tr>
                <th className="py-3 px-4 w-12 text-slate-500">#</th>
                {metadata.columns
                  .filter((c) => visibleColumns.includes(c.name))
                  .map((col) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-900 transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200">{col.name}</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                        {sortColumn === col.name && (
                          <span className="text-[10px] text-sky-400 font-mono">
                            {sortAscending ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-sky-400" /> Loading rows...
                    </div>
                  </td>
                </tr>
              ) : preview && preview.rows.length > 0 ? (
                preview.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-500 font-sans">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    {metadata.columns
                      .filter((c) => visibleColumns.includes(c.name))
                      .map((col) => (
                        <td key={col.name} className="py-2.5 px-4 truncate max-w-xs">
                          {row[col.name] !== null && row[col.name] !== undefined ? (
                            String(row[col.name])
                          ) : (
                            <span className="text-slate-600 italic">null</span>
                          )}
                        </td>
                      ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-slate-500">
                    No records found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 bg-slate-950 text-xs text-slate-400">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-200">
              {preview ? Math.min((page - 1) * pageSize + 1, preview.total_rows) : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-200">
              {preview ? Math.min(page * pageSize, preview.total_rows) : 0}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-200">
              {preview ? preview.total_rows.toLocaleString() : 0}
            </span>{" "}
            records
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="px-2 font-mono">
              Page {page} of {preview?.total_pages || 1}
            </span>
            <button
              disabled={!preview || page >= preview.total_pages || loading}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

