"use client";

import React from "react";
import Link from "next/link";
import {
  Database,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Cpu,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 mb-6 shadow-sm">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Universal Analytics & Visualisation Platform • CMP7227 MSc AI</span>
      </div>

      {/* Main Title */}
      <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-tight" style={{ color: "var(--text-primary)" }}>
        Turn Any Dataset Into <br />
        <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Meaningful Visual Intelligence
        </span>
      </h1>

      <p className="mt-6 max-w-2xl text-base sm:text-lg" style={{ color: "var(--text-secondary)" }}>
        A completely dynamic, schema-agnostic platform engineered for Birmingham City University.
        Upload CSV or Excel files with over 100,000+ records to immediately receive automated
        statistical analyses, data quality diagnostics, interactive dashboards, and evidence-based findings.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/upload"
          className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-indigo-500 transition-all scale-100 hover:scale-[1.02]"
        >
          <Database className="h-4 w-4" /> Upload Your Dataset <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          View Live Dashboard
        </Link>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
        <div
          className="rounded-2xl p-6 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Dynamic Schema Mapping</h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Never hardcoded. Instantly identifies numerical, categorical, date/time, and boolean series
            on any dataset without predefined field names.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Universal Visualisation Studio</h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Algorithmic chart recommendations (bivariate, multivariate, time-series) plus a customizable
            builder with multi-type aggregations.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Evidence-Based Insights</h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Descriptive and inferential findings backed strictly by Pearson correlations, IQR bounds,
            and parametric statistics. Zero external AI dependencies.
          </p>
        </div>
      </div>
    </div>
  );
}
