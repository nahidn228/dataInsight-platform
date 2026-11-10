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
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>No Dataset Active</h2>
        <p className="max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-400">
            <Compass className="h-4 w-4" /> Server-side High Performance Data Explorer
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--text-primary)" }}>
            Interactive Tabular Data Grid
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={DatasetApi.getExportUrl(datasetId, "csv")}
            download
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition"
            style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-4" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search across all records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
              style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 relative">
          {/* Column Visibility Menu */}
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            <Eye className="h-3.5 w-3.5" /> Columns ({visibleColumns.length}/{metadata.columns.length})
          </button>

          {showColMenu && (
            <div className="absolute right-0 top-11 z-50 w-56 max-h-64 overflow-y-auto rounded-xl p-3 shadow-xl" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
              <span className="text-xs font-semibold block mb-2" style={{ color: "var(--text-secondary)" }}>Toggle Fields</span>
              <div className="space-y-1.5">
                {metadata.columns.map((col) => (
                  <label key={col.name} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.name)}
                      onChange={() => toggleColumn(col.name)}
                      className="rounded text-sky-500 focus:ring-0"
                      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
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
            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
            style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 font-semibold tracking-wider uppercase" style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-secondary)" }}>
              <tr>
                <th className="py-3 px-4 w-12" style={{ color: "var(--text-muted)" }}>#</th>
                {metadata.columns
                  .filter((c) => visibleColumns.includes(c.name))
                  .map((col) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className="py-3 px-4 cursor-pointer hover:opacity-80 transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: "var(--text-primary)" }}>{col.name}</span>
                        <ArrowUpDown className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
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
            <tbody className="font-mono" style={{ color: "var(--text-primary)" }}>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-sky-400" /> Loading rows...
                    </div>
                  </td>
                </tr>
              ) : preview && preview.rows.length > 0 ? (
                preview.rows.map((row, idx) => (
                  <tr key={idx} className="hover:opacity-80" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="py-2.5 px-4 font-sans" style={{ color: "var(--text-muted)" }}>
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    {metadata.columns
                      .filter((c) => visibleColumns.includes(c.name))
                      .map((col) => (
                        <td key={col.name} className="py-2.5 px-4 truncate max-w-xs">
                          {row[col.name] !== null && row[col.name] !== undefined ? (
                            String(row[col.name])
                          ) : (
                            <span className="italic" style={{ color: "var(--text-muted)" }}>null</span>
                          )}
                        </td>
                      ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    No records found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-secondary)" }}>
          <div>
            Showing{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {preview ? Math.min((page - 1) * pageSize + 1, preview.total_rows) : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {preview ? Math.min(page * pageSize, preview.total_rows) : 0}
            </span>{" "}
            of{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {preview ? preview.total_rows.toLocaleString() : 0}
            </span>{" "}
            records
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs disabled:opacity-40"
              style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="px-2 font-mono">
              Page {page} of {preview?.total_pages || 1}
            </span>
            <button
              disabled={!preview || page >= preview.total_pages || loading}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs disabled:opacity-40"
              style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
