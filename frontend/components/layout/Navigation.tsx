"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  Compass,
  ShieldCheck,
  BarChart3,
  PieChart,
  Lightbulb,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";
import { useTheme } from "@/context/ThemeContext";

function cleanDisplayName(rawName?: string): string {
  if (!rawName || rawName.trim().toLowerCase() in ["", "none", "nan", "null", "untitled", "unnamed"]) {
    return "Uploaded Dataset";
  }
  const stripped = rawName.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?/, "");
  return stripped || "Uploaded Dataset";
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "Dashboard Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload Dataset", href: "/upload", icon: UploadCloud },
  { name: "Data Explorer", href: "/explorer", icon: Compass },
  { name: "Data Quality", href: "/data-quality", icon: ShieldCheck },
  { name: "Statistical Analysis", href: "/statistics", icon: BarChart3 },
  { name: "Visualisation Studio", href: "/visualizations", icon: PieChart },
  { name: "Insights & Findings", href: "/insights", icon: Lightbulb },
  { name: "Reports & Exports", href: "/reports", icon: FileSpreadsheet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { metadata, datasetId, setDatasetId } = useDataset();

  return (
    <aside
      className={`relative flex flex-col shrink-0 transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        color: "var(--text-primary)",
      }}
    >
      {/* Brand Header */}
      <div
        className="flex h-16 items-center justify-between px-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <span
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                DataInsight
              </span>
              <span
                className="block text-[10px] font-medium uppercase tracking-wider"
                style={{ color: "var(--accent-sky)" }}
              >
                CMP7227 • BCU
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600">
            <Database className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 transition-colors hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Dataset Quick Status Badge */}
      <div
        className="px-3 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {metadata ? (
          <div
            className={`rounded-lg p-2.5 ${collapsed ? "text-center" : ""}`}
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {!collapsed ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Active Dataset
                  </span>
                  <button
                    onClick={() => setDatasetId(null)}
                    className="text-[11px] flex items-center gap-1 hover:opacity-70"
                    style={{ color: "var(--accent-sky)" }}
                  >
                    <RefreshCw className="h-3 w-3" /> Change
                  </button>
                </div>
                <p
                  className="truncate text-xs font-semibold"
                  title={metadata.filename}
                  style={{ color: "var(--text-primary)" }}
                >
                  {cleanDisplayName(metadata.filename)}
                </p>
                <div
                  className="flex items-center gap-2 text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{metadata.total_rows.toLocaleString()} rows</span>
                  <span>•</span>
                  <span>{metadata.total_columns} cols</span>
                </div>
              </div>
            ) : (
              <div title={metadata.filename}>
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`rounded-lg p-2 text-center ${collapsed ? "py-2" : ""}`}
            style={{
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            {!collapsed ? (
              <span className="text-xs text-amber-500 font-medium">
                No Dataset Loaded
              </span>
            ) : (
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
            )}
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0" : ""
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: "#0ea5e9",
                      color: "#ffffff",
                    }
                  : {
                      color: "var(--text-secondary)",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-secondary)";
                }
              }}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        {!collapsed ? (
          <div className="text-[11px] space-y-0.5" style={{ color: "var(--text-muted)" }}>
            <p>MSc AI CMP7227 • 2026/27</p>
            <p style={{ color: "var(--text-secondary)" }}>
              Birmingham City University
            </p>
          </div>
        ) : (
          <div
            className="text-center text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            BCU
          </div>
        )}
      </div>
    </aside>
  );
}

export function Navbar() {
  const { metadata } = useDataset();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="flex h-16 w-full items-center justify-between px-6 backdrop-blur"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-3">
        <h1
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Turn Your Data Into Meaningful Insights
        </h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          Universal Dynamic Engine
        </span>
      </div>

      <div className="flex items-center gap-4">
        {metadata && (
          <div
            className="hidden sm:flex items-center gap-3 text-xs rounded-md px-3 py-1.5"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>
              Dataset Memory:
            </span>
            <span className="font-mono font-semibold" style={{ color: "var(--accent-sky)" }}>
              {metadata.memory_usage_mb} MB
            </span>
            <span style={{ color: "var(--border-default)" }}>|</span>
            <span style={{ color: "var(--text-secondary)" }}>File Size:</span>
            <span className="font-mono" style={{ color: "var(--accent-indigo)" }}>
              {metadata.file_size_formatted}
            </span>
          </div>
        )}

        {/* API status */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-emerald-500">
            API Connected
          </span>
        </div>

        {/* ── Theme Toggle Button ── */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: theme === "dark" ? "rgba(251,191,36,0.1)" : "rgba(99,102,241,0.1)",
            border: theme === "dark" ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(99,102,241,0.3)",
          }}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-500" />
          )}
        </button>
      </div>
    </header>
  );
}
