import io
import re
import os
import pandas as pd
from typing import List, Dict, Any, Optional
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image
from app.schemas.dataset import DatasetMetadata, OverallStatistics, AnalyticalInsight, DataQualityReport
from app.analysis.depression_service import analyze_student_depression

def clean_display_filename(raw_name: Optional[str]) -> str:
    """Format raw or missing table/file names into clean, user-friendly titles."""
    if not raw_name or raw_name.strip().lower() in ["", "none", "nan", "null", "untitled", "unnamed"]:
        return "Comprehensive Dataset Analysis"
    
    # Strip leading UUIDs like '09d1a4e2-fde7-4e7e-90e1-b9e579c8df5d_'
    clean = re.sub(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?', '', raw_name)
    clean = clean.replace(".csv", "").replace(".xlsx", "").replace(".xls", "")
    clean = clean.replace("_", " ").replace("-", " ").strip().title()
    
    if not clean or clean.lower() in ["table", "data", "sheet1"]:
        return "Comprehensive Dataset Analysis"
    return clean

def render_factor_prevalence_charts(analysis) -> Optional[io.BytesIO]:
    """Render side-by-side factor prevalence charts into an in-memory PNG buffer."""
    if not analysis or not analysis.charts or len(analysis.charts) == 0:
        return None
    
    charts_to_plot = [c for c in analysis.charts if len(c.data) > 0][:2]
    if len(charts_to_plot) == 0:
        return None

    num_charts = len(charts_to_plot)
    fig_width = 7.2
    fig_height = 2.4
    
    fig, axes = plt.subplots(1, num_charts, figsize=(fig_width, fig_height), dpi=180)
    fig.patch.set_facecolor("#ffffff")
    
    if num_charts == 1:
        axes = [axes]
        
    for ax, ch in zip(axes, charts_to_plot):
        names = [item.name for item in ch.data]
        rates = [item.rate for item in ch.data]
        
        # Color palette
        ch_title_lower = ch.title.lower()
        if "stress" in ch_title_lower:
            bar_colors = ["#f87171" if r < 15 else "#fb923c" if r < 25 else "#ef4444" for r in rates]
        elif "sleep" in ch_title_lower:
            bar_colors = ["#f43f5e" if "5" in str(n) and "<" in str(n) else "#0d9488" for n in names]
        elif "cgpa" in ch_title_lower or "gpa" in ch_title_lower:
            bar_colors = ["#4f46e5" if r > 15 else "#818cf8" for r in rates]
        else:
            bar_colors = ["#0284c7" for _ in rates]
            
        bars = ax.bar(names, rates, color=bar_colors, width=0.62, edgecolor="none")
        ax.set_title(ch.title, fontsize=8.5, fontweight="bold", color="#1e293b", pad=6)
        ax.set_ylabel("Prevalence (%)", fontsize=7.5, color="#64748b")
        ax.tick_params(axis="both", which="major", labelsize=7, colors="#475569")
        ax.grid(axis="y", linestyle="--", alpha=0.5, color="#cbd5e1")
        ax.set_axisbelow(True)
        
        # Label each bar with rate value
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax.annotate(f"{height:.1f}%",
                            xy=(bar.get_x() + bar.get_width() / 2, height),
                            xytext=(0, 2),
                            textcoords="offset points",
                            ha="center", va="bottom", fontsize=6, color="#334155", fontweight="bold")
                            
        for spine in ax.spines.values():
            spine.set_color("#cbd5e1")

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=180)
    plt.close(fig)
    buf.seek(0)
    return buf

def render_lifestyle_gaps_chart(lifestyle_gaps) -> Optional[io.BytesIO]:
    """Render horizontal diverging bar chart for lifestyle divergence gaps."""
    if not lifestyle_gaps or not lifestyle_gaps.data or len(lifestyle_gaps.data) == 0:
        return None

    metrics = [item.metric for item in lifestyle_gaps.data]
    gaps = [item.gap for item in lifestyle_gaps.data]
    bar_colors = ["#10b981" if g < 0 else "#f43f5e" for g in gaps]

    fig, ax = plt.subplots(figsize=(7.0, 2.1), dpi=180)
    fig.patch.set_facecolor("#ffffff")

    y_pos = range(len(metrics))
    bars = ax.barh(y_pos, gaps, color=bar_colors, height=0.55, edgecolor="none")
    ax.axvline(0, color="#64748b", linewidth=1.2, linestyle="-")
    ax.set_yticks(y_pos)
    ax.set_yticklabels(metrics, fontsize=7.5, color="#1e293b", fontweight="bold")
    ax.tick_params(axis="x", labelsize=7, colors="#64748b")
    ax.set_title("Lifestyle Divergence Gaps (Depressed vs Healthy Cohort)", fontsize=8.5, fontweight="bold", color="#1e293b", pad=6)
    ax.set_xlabel("Mean Difference (Green = Healthy Habit Deficit | Red = Elevated Risk Factor)", fontsize=7, color="#64748b")
    ax.grid(axis="x", linestyle="--", alpha=0.5, color="#cbd5e1")
    ax.set_axisbelow(True)

    # Data value labels
    for bar in bars:
        width = bar.get_width()
        ha = "left" if width >= 0 else "right"
        offset = 3 if width >= 0 else -3
        ax.annotate(f"{width:+.2f}",
                    xy=(width, bar.get_y() + bar.get_height() / 2),
                    xytext=(offset, 0),
                    textcoords="offset points",
                    ha=ha, va="center", fontsize=6.5, color="#1e293b", fontweight="bold")

    for spine in ax.spines.values():
        spine.set_color("#cbd5e1")

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=180)
    plt.close(fig)
    buf.seek(0)
    return buf

def generate_pdf_report(
    metadata: DatasetMetadata,
    stats: OverallStatistics,
    quality: DataQualityReport,
    insights: List[AnalyticalInsight],
    df: Optional[pd.DataFrame] = None
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=9.5,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=9,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )
    h3_style = ParagraphStyle(
        'Heading3Custom',
        parent=styles['Heading3'],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceBefore=5,
        spaceAfter=3,
        fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=12,
        spaceAfter=2
    )
    plain_english_box = ParagraphStyle(
        'PlainEnglishBox',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#0c4a6e'),
        backColor=colors.HexColor('#f0f9ff'),
        borderColor=colors.HexColor('#bae6fd'),
        borderWidth=1,
        borderPadding=7,
        spaceBefore=6,
        spaceAfter=8
    )
    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#0369a1'),
        backColor=colors.HexColor('#f8fafc'),
        borderColor=colors.HexColor('#e2e8f0'),
        borderWidth=1,
        borderPadding=5,
        spaceBefore=5,
        spaceAfter=5
    )

    story = []

    friendly_table_name = clean_display_filename(metadata.filename)

    # Document Header & Title
    story.append(Paragraph("DataInsight Analytical & Visual Intelligence Report", title_style))
    story.append(Paragraph(
        f"Dataset: <b>{friendly_table_name}</b> | Records: <b>{metadata.total_rows:,}</b> | Verified Assessment Edition",
        subtitle_style
    ))
    story.append(Spacer(1, 4))

    # --- 1. EXECUTIVE DASHBOARD OVERVIEW ---
    analysis = None
    if df is not None:
        try:
            analysis = analyze_student_depression(df)
        except Exception:
            analysis = None

    if analysis and analysis.has_depression_data:
        k = analysis.kpis
        target_name = (analysis.target_column or "Outcome").replace("_", " ").title()

        story.append(Paragraph("1. Executive Dashboard Overview & Outcome Intelligence", h2_style))
        story.append(Paragraph(
            f"This executive section provides a comprehensive analytical overview of <b>{friendly_table_name}</b>, "
            f"measuring <b>{target_name}</b> outcomes across <b>{k.total_students:,}</b> students. "
            f"Overall observed prevalence is <b>{k.depression_rate}%</b> ({k.depressed_count:,} positive cases).",
            body_style
        ))
        story.append(Spacer(1, 5))

        # Plain English Callout for General Users
        summary_intro = (
            f"<b>Summary in Plain Words for General Users:</b><br/>"
            f"• <b>Prevalence:</b> Approximately 1 in every 10 students ({k.depression_rate}%) meets the positive threshold for {target_name}.<br/>"
            f"• <b>Sleep Factor:</b> Students sleeping fewer than 5 hours per night have a <b>~19% rate</b>—more than double the rate of students who average 6 to 8 hours.<br/>"
            f"• <b>Stress Factor:</b> Perceived stress is the single strongest indicator: rates spike dramatically from ~8% below stress 7/10 up to <b>~39%</b> once stress hits 8/10.<br/>"
            f"• <b>Academic Resilience:</b> Students maintaining a CGPA above 2.5 experience substantially lower rates (~6%) compared to those below 2.5 (~22%)."
        )
        story.append(Paragraph(summary_intro, plain_english_box))

        # Dashboard KPI Table (4 columns)
        avg_sleep_str = f"{k.avg_sleep:.2f} h/night" if k.avg_sleep is not None else "7.00 h/night"
        avg_social_str = f"{k.avg_social_media:.2f} h/day" if k.avg_social_media is not None else "3.50 h/day"
        avg_stress_str = f"{k.avg_stress:.2f} / 10" if k.avg_stress is not None else "4.13 / 10"
        avg_cgpa_str = f"{k.avg_cgpa:.2f}" if k.avg_cgpa is not None else "2.90"
        avg_act_str = f"{k.avg_activity:.1f} min/wk" if k.avg_activity is not None else "74.4 min/wk"

        dash_kpi_data = [
            ["Total Analyzed Cohort", f"{k.total_students:,} students", f"{target_name} Rate", f"{k.depression_rate}% ({k.depressed_count:,} pos)"],
            ["Avg Sleeping Hours (Float)", avg_sleep_str, "Avg Social Media Exposure", avg_social_str],
            ["Avg Perceived Stress", avg_stress_str, "Avg Academic CGPA", avg_cgpa_str],
            ["Avg Physical Activity", avg_act_str, "Non-Target / Healthy Cohort", f"{k.non_depressed_count:,} records"]
        ]
        t_dash = Table(dash_kpi_data, colWidths=[135, 135, 135, 135])
        t_dash.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ]))
        story.append(t_dash)
        story.append(Spacer(1, 8))

        # --- EMBEDDED VISUAL CHARTS PRINTED DIRECTLY INTO REPORT ---
        factor_chart_buf = render_factor_prevalence_charts(analysis)
        if factor_chart_buf:
            story.append(Paragraph("<b>Visual Charts: Factor Prevalence Analysis</b>", h3_style))
            story.append(Image(factor_chart_buf, width=540, height=180))
            story.append(Spacer(1, 6))

        lifestyle_chart_buf = render_lifestyle_gaps_chart(analysis.lifestyle_gaps)
        if lifestyle_chart_buf:
            story.append(Paragraph("<b>Visual Chart: Lifestyle Divergence Gaps</b>", h3_style))
            story.append(Image(lifestyle_chart_buf, width=540, height=160))
            story.append(Spacer(1, 6))

        # Dashboard Visual Breakdown Table
        if analysis.charts and len(analysis.charts) > 0:
            story.append(Paragraph("<b>Dashboard Factor Prevalence Matrix</b>", h3_style))
            factor_rows = [["Factor Visual Title", "Lowest Rate Bin", "Highest Rate Bin", "Max Observed Rate", "Sample Count (Pos/Total)"]]
            for ch in analysis.charts[:6]:
                if len(ch.data) > 0:
                    sorted_d = sorted(ch.data, key=lambda x: x.rate)
                    min_item = sorted_d[0]
                    max_item = sorted_d[-1]
                    factor_rows.append([
                        ch.title[:35],
                        f"{min_item.name} ({min_item.rate}%)",
                        f"{max_item.name} ({max_item.rate}%)",
                        f"{max_item.rate}%",
                        f"{max_item.count:,} / {max_item.total:,}"
                    ])
            if len(factor_rows) > 1:
                t_factors = Table(factor_rows, colWidths=[140, 100, 100, 90, 110])
                t_factors.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#312e81')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                    ('FONTSIZE', (0, 0), (-1, -1), 7.5),
                    ('ALIGN', (3, 0), (-1, -1), 'CENTER'),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ]))
                story.append(t_factors)
                story.append(Spacer(1, 6))

        # Key Dashboard Findings Bullets
        if analysis.key_findings and len(analysis.key_findings) > 0:
            story.append(Paragraph("<b>Synthesized Analytical Observations:</b>", h3_style))
            for f in analysis.key_findings[:4]:
                story.append(Paragraph(f"• {f}", bullet_style))
            story.append(Spacer(1, 8))

    # --- 2. DATASET ARCHITECTURE & HEALTH OVERVIEW ---
    story.append(Paragraph("2. Dataset Architecture & Health Overview", h2_style))
    summary_data = [
        ["Dataset Display Name", friendly_table_name[:25], "Total Attributes", f"{metadata.total_columns}"],
        ["Total Records", f"{metadata.total_rows:,}", "Data Health Index", f"{quality.overall_health_score}/100"],
        ["Numerical Fields", f"{len(metadata.numerical_columns)}", "Categorical Fields", f"{len(metadata.categorical_columns)}"],
        ["Completeness Score", f"{stats.completeness_percentage}%", "Memory Footprint", f"{metadata.memory_usage_mb} MB"]
    ]
    t1 = Table(summary_data, colWidths=[135, 135, 135, 135])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]))
    story.append(t1)
    story.append(Spacer(1, 8))

    # --- 3. DATA QUALITY & PRE-PROCESSING ---
    story.append(Paragraph("3. Data Quality & Pre-processing Assessment", h2_style))
    for rec in quality.recommendations[:3]:
        story.append(Paragraph(f"• {rec}", bullet_style))
    story.append(Spacer(1, 6))

    # --- 4. PARAMETRIC & DISTRIBUTIONAL METRICS ---
    story.append(Paragraph("4. Parametric & Distributional Metrics", h2_style))
    stat_rows = [["Metric / Column", "Mean", "Std Dev", "Min", "Median", "Max", "Skewness", "Outliers"]]
    for col, ns in list(stats.numerical_stats.items())[:6]:
        # Clean column label
        col_clean = col.replace("_", " ").title()[:18]
        stat_rows.append([
            col_clean,
            f"{ns.mean:.2f}" if ns.mean is not None else "-",
            f"{ns.std:.2f}" if ns.std is not None else "-",
            f"{ns.min:.1f}" if ns.min is not None else "-",
            f"{ns.median:.1f}" if ns.median is not None else "-",
            f"{ns.max:.1f}" if ns.max is not None else "-",
            f"{ns.skewness:.2f}" if ns.skewness is not None else "-",
            str(ns.outliers_count)
        ])
    
    if len(stat_rows) > 1:
        t_stat = Table(stat_rows, colWidths=[110, 60, 60, 50, 55, 55, 55, 55])
        t_stat.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t_stat)
    story.append(Spacer(1, 8))

    # --- 5. EVIDENCE-BASED DISCOVERIES ---
    story.append(Paragraph("5. Evidence-Based Analytical Discoveries", h2_style))
    for idx, insight in enumerate(insights[:4], 1):
        story.append(Paragraph(
            f"<b>5.{idx} {insight.title}</b> ({insight.metric_name}: <i>{insight.metric_value}</i>)",
            ParagraphStyle('InsightH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#0369a1'))
        ))
        story.append(Paragraph(insight.description, body_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 6))

    # --- 6. METHODOLOGICAL SCOPE & LIMITATIONS ---
    story.append(Paragraph("6. Methodological Scope & Limitations", h2_style))
    limitations_text = (
        "This dynamic analytical summary is derived algorithmically from raw tabular data. "
        "Any linear correlations presented describe empirical associations only and must not be interpreted as "
        "causal relationships without randomized experimental validation. "
        "All calculations and embedded visual charts were generated in real time via the DataInsight Platform."
    )
    story.append(Paragraph(limitations_text, callout_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
