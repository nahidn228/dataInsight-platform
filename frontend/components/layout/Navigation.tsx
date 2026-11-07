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
} from "lucide-react";
import { useDataset } from "@/context/DatasetContext";

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
      className={`relative flex flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      } shrink-0`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">DataInsight</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-sky-400">
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
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-white"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Dataset Quick Status Badge */}
      <div className="px-3 py-3 border-b border-slate-800/60">
        {metadata ? (
          <div
            className={`rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 ${
              collapsed ? "text-center" : ""
            }`}
          >
            {!collapsed ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Active Dataset</span>
                  <button
                    onClick={() => setDatasetId(null)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Change
                  </button>
                </div>
                <p className="truncate text-xs font-semibold text-slate-100" title={metadata.filename}>
                  {metadata.filename}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
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
            className={`rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center ${
              collapsed ? "py-2" : ""
            }`}
          >
            {!collapsed ? (
              <span className="text-xs text-amber-300 font-medium">No Dataset Loaded</span>
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
                isActive
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="border-t border-slate-800/80 p-3">
        {!collapsed ? (
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p>MSc AI CMP7227 • 2026/27</p>
            <p className="text-slate-400">Birmingham City University</p>
          </div>
        ) : (
          <div className="text-center text-[10px] text-slate-500 font-mono">BCU</div>
        )}
      </div>
    </aside>
  );
}

export function Navbar() {
  const { metadata } = useDataset();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Turn Your Data Into Meaningful Insights
        </h1>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
          Universal Dynamic Engine
        </span>
      </div>

      <div className="flex items-center gap-4">
        {metadata && (
          <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5">
            <span className="text-slate-400">Dataset Memory:</span>
            <span className="font-mono text-sky-400 font-semibold">{metadata.memory_usage_mb} MB</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">File Size:</span>
            <span className="font-mono text-indigo-400">{metadata.file_size_formatted}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-emerald-400">API Connected</span>
        </div>
      </div>
    </header>
  );
}
